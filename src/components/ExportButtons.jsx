import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

const ExportButtons = ({ data, filename = 'relatorio', type = 'sales' }) => {
    const exportToCSV = () => {
        if (!data || data.length === 0) {
            alert('Não há dados para exportar');
            return;
        }

        let csvData = [];

        if (type === 'sales') {
            csvData = data.map(item => ({
                'Data': item.date,
                'Vendas (R$)': item.sales,
                'Pedidos': item.orders
            }));
        } else if (type === 'best-sellers') {
            csvData = data.map((item, index) => ({
                'Posição': index + 1,
                'Produto': item.name,
                'Quantidade Vendida': item.quantitySold,
                'Receita (R$)': item.revenue
            }));
        }

        const csv = Papa.unparse(csvData);
        // Add BOM for Excel UTF-8 compatibility
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportToPDF = () => {
        if (!data || data.length === 0) {
            alert('Não há dados para exportar');
            return;
        }

        try {
            const doc = new jsPDF();

            // Add Title
            doc.setFontSize(18);
            doc.text(filename.replace(/-/g, ' ').toUpperCase(), 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 14, 30);

            let yPos = 40;
            const lineHeight = 10;

            if (type === 'best-sellers') {
                // Headers
                doc.setFontSize(12);
                doc.setTextColor(0);
                doc.setFont(undefined, 'bold');
                doc.text('Pos.', 14, yPos);
                doc.text('Produto', 30, yPos);
                doc.text('Qtd.', 140, yPos);
                doc.text('Receita', 170, yPos);

                yPos += lineHeight;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);

                // Data
                data.forEach((item, index) => {
                    if (yPos > 280) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(`${index + 1}`, 14, yPos);

                    // Truncate long names
                    const name = item.name.length > 50 ? item.name.substring(0, 50) + '...' : item.name;
                    doc.text(name, 30, yPos);

                    doc.text(`${item.quantitySold}`, 140, yPos);
                    doc.text(`R$ ${item.revenue.toFixed(2)}`, 170, yPos);

                    yPos += lineHeight;
                });
            } else if (type === 'sales') {
                // Headers
                doc.setFontSize(12);
                doc.setTextColor(0);
                doc.setFont(undefined, 'bold');
                doc.text('Data', 14, yPos);
                doc.text('Vendas', 80, yPos);
                doc.text('Pedidos', 140, yPos);

                yPos += lineHeight;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);

                // Data
                data.forEach((item) => {
                    if (yPos > 280) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(item.date, 14, yPos);
                    doc.text(`R$ ${item.sales.toFixed(2)}`, 80, yPos);
                    doc.text(`${item.orders}`, 140, yPos);

                    yPos += lineHeight;
                });
            }

            doc.save(`${filename}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Erro ao gerar PDF');
        }
    };

    return (
        <div className="flex gap-3">
            <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-bold uppercase text-sm"
            >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar CSV
            </button>
            <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-bold uppercase text-sm"
            >
                <FileText className="w-4 h-4" />
                Exportar PDF
            </button>
        </div>
    );
};

export default ExportButtons;
