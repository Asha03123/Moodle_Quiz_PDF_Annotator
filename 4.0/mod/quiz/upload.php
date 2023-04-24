<?php

/**
 * @author Tausif Iqbal, Vishal Rao
 * This page saves annotated pdf to database.
 * 
 * It gets the file data from JavaScript through POST request.
 * Then save it temporarily in this directory.
 * Then create new file in databse using this temporary file.
 */

require_once('../../config.php');
require_once('locallib.php');
require __DIR__ . '/parsefunctions.php';
require __DIR__ . '/parser.php';
require __DIR__ . '/alphapdf.php';


//Getting all the data from mypdfannotate.js
$value = $_POST['id'];
$contextid = $_POST['contextid'];
$attemptid = $_POST['attemptid'];
$filename = $_POST['filename'];
$component = 'question';
$filearea = 'response_attachments';
$filepath = '/';
$itemid = $attemptid;

echo $contextid;

$fs = get_file_storage();
// Prepare file record object
$fileinfo = array(
    'contextid' => $contextid,
    'component' => $component,
    'filearea' => $filearea,
    'itemid' => $itemid,
    'filepath' => $filepath,
    'filename' => $filename);

$values = $value;
$json = json_decode($values,true);

// //Get the page orientation
$orientation=$json["page_setup"]['orientation'];
$orientation=($orientation=="portrait")? 'p' : 'l';
echo $orientation;

//To convert PDF versions to 1.4 if the version is above it since FPDI parser will only work for PDF versions upto 1.4
$file = 'dummy.pdf'; 
$filepdf = fopen($file,"r");
if ($filepdf) 
{
    $line_first = fgets($filepdf);
    preg_match_all('!\d+!', $line_first, $matches);	
    // save that number in a variable
    $pdfversion = implode('.', $matches[0]);
    if($pdfversion > "1.4")
    {
        $srcfile_new="newdummy.pdf";
        $srcfile=$file;
        shell_exec('gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE \
        -dBATCH -sOutputFile="'.$srcfile_new.'" "'.$srcfile.'"'); 
        $file=$srcfile_new;
    }
fclose($filepdf);
}

//Using FPDF and FPDI to annotate
$pdf = new AlphaPDF($orientation); 
if(file_exists("./".$file))
    $pagecount = $pdf->setSourceFile($file); 
else
    die('\nSource PDF not found!'); 

for($i=1 ; $i <= $pagecount; $i++)
{
    $tpl = $pdf->importPage($i); 
    $size = $pdf->getTemplateSize($tpl); 
    $pdf->addPage(); 
    $pdf->useTemplate($tpl, 1, 1, $size['width'], $size['height'], FALSE); 
    if(count((array)$json["pages"][$i-1]) ==0)
        continue;
    $objnum=count((array)$json["pages"][$i-1][0]["objects"]);
    for($j=0;$j<$objnum;$j++)
    {
        $arr = $json["pages"][$i-1][0]["objects"][$j];
        if($arr["type"]=="path")
        {
           draw_path($arr,$pdf);
        }
        else if($arr["type"]=="i-text")
        {
            insert_text($arr,$pdf);
        }
        else if($arr["type"]=="rect")
        {
            draw_rect($arr,$pdf);
        }
    }
}


$pdf->Output('F','outputmoodle.pdf');

$fname='outputmoodle.pdf';
$temppath = './' . $fname;

$fs = get_file_storage();
// Prepare file record object
$fileinfo = array(
    'contextid' => $contextid,
    'component' => $component,
    'filearea' => $filearea,
    'itemid' => $itemid,
    'filepath' => $filepath,
    'filename' => $filename);

//check if file already exists, then first delete it.
$doesExists = $fs->file_exists($contextid, $component, $filearea, $itemid, $filepath, $filename);
if($doesExists === true)
{
    $storedfile = $fs->get_file($contextid, $component, $filearea, $itemid, $filepath, $filename);
    $storedfile->delete();
}
// finally save the file (creating a new file)
$fs->create_file_from_pathname($fileinfo, $temppath);

// Deleting temporary files
shell_exec("rm -rf dummy.pdf");
shell_exec("rm -rf outputmoodle.pdf");
?>

