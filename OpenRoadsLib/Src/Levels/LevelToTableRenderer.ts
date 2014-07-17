module Levels {
    interface lookup {
        [idx: string]: string;
    }
    export class LevelToTableRenderer {
        convertColors(l: Level): HTMLTableElement {
            var table: HTMLTableElement = <HTMLTableElement>document.createElement('table');
            var row: HTMLTableRowElement = <HTMLTableRowElement>table.insertRow(-1);
            for (var i: number = 0; i < l.Colors.length; i++) {
                var cell: HTMLTableCellElement = <HTMLTableCellElement>row.insertCell(-1);
                cell.style.backgroundColor = l.Colors[i].toCss();
                cell.style.color = l.Colors[i].negative().toCss();
                cell.innerHTML = '' + i;
            }

            return table;
        }

        convert(l: Level): HTMLTableElement {
            //Color(0): No tile
            //Color(128): Slidey gray
            //Color(160): Accelerator
            //Color(10): Accelerator
            //Color(12): Kill
            var labels: lookup = {
                '1': '1', //Tunnel
                '2': '2', //Raised by one whole unit (must jump)
                '4': '3', //Raised by two units
                '8': '4',
                '16': '5',
                '32': '6',
                '64': '7',
                '128': '8'
            };
            function assignColors(el: HTMLElement, cols: CubeColors) {
                el.style.color = cols.Top.negative().toCss();
                el.style.backgroundColor = cols.Top.toCss();
                el.style.borderRight = el.style.borderLeft = '1px solid ' + cols.Front.toCss();
                el.style.borderTop = '1px solid ' + cols.Left.toCss();
                el.style.borderBottom = '1px solid ' + cols.Right.toCss();
            }

            var table: HTMLTableElement = <HTMLTableElement>document.createElement('table');
            table.className = 'debugTable';
            for (var x = 0; x < l.width(); x++) {
                var row: HTMLTableRowElement = <HTMLTableRowElement>table.insertRow(-1);

                for (var y = 0; y < l.length(); y++) {
                    var cell: Cell = l.Cells[x][y];
                    var ttcell = row.insertCell(-1);
                    var tcell = document.createElement('div');
                    ttcell.appendChild(tcell);
                    tcell.innerHTML = '&nbsp;';
                    tcell.style.backgroundColor = '#000';
                    tcell.style.color = '#000';
                    tcell.style.width = '100px';
                    if (cell.Tile != null) {
                        assignColors(tcell, cell.Tile.Colors);
                        tcell.innerHTML = '' + cell.CI;
                    }
                    if (cell.Tunnel != null) {
                        var tDiv = document.createElement('div');
                        tDiv.innerHTML = 'T';
                        tDiv.style.display = 'inline-block';
                        tDiv.style.backgroundColor = cell.Tunnel.TunnelColors[3].toCss();
                        tDiv.style.color = cell.Tunnel.TunnelColors[3].negative().toCss();
                        tcell.appendChild(tDiv);
                    }
                    if (cell.Cube != null) {
                        var cDiv = document.createElement('div');
                        cDiv.style.display = 'inline-block';
                        assignColors(cDiv, cell.Cube.Colors);
                        cDiv.innerHTML = 'C' + cell.Cube.Height;
                        tcell.appendChild(cDiv);
                    }
                }
            }
            return table;
        }
    }
}