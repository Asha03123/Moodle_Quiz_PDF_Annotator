<?php
// Function to draw free hand drawing
function draw_path($arr, $pdf) 
{
    $list=parser_path($arr);
    $stroke = process_color(end($list));
    $pdf->SetDrawColor($stroke[0], $stroke[1], $stroke[2]);
    for($k = 0; $k < sizeof($list) - 2; $k++) {
        $pdf->Line($list[$k][0], 
        $list[$k][1], 
        $list[$k + 1][0], 
        $list[$k + 1][1]);
    } 
}

//Function to insert text
function insert_text($arr,$pdf)
{
    $list=parser_text($arr);
    $color = process_color($list[5]);
    $pdf->SetTextColor($color[0], $color[1], $color[2]);
    $pdf->SetFont('Times');
    $pdf->SetFontSize(($list[6]/1.6));
    $pdf->text($list[0],
    $list[1] + $list[3],
    $list[4]);
}

//Function to draw a rectangle
function draw_rect($arr,$pdf)
{
    $list=parser_rectangle($arr);
    $fill=process_color($list[4]);
    $pdf->SetFillColor($fill[0],$fill[1],$fill[2]);
    $pdf->SetAlpha(0.20);
    $pdf->Rect($list[0],
    $list[1],
    $list[2],
    $list[3],'F');
    $pdf->SetAlpha(1);
}
?>