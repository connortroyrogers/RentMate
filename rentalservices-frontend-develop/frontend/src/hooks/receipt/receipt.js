import jsPDF from 'jspdf';

const formatDollar = (num) => {
    num = parseFloat(num)
    return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }

export const generateReceipt = async (pdfData, isInitial) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor('#333333');
    doc.text('RentMate', 14, 20);
    doc.text('Rental Transaction Receipt', 14, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor('#000000');

    doc.text(`Rental Transaction ID: ${pdfData.id}`, 10, 50);
    doc.text(`Rental Transaction Date: ${pdfData.date}`, 10, 60);
    doc.text(`Product: ${pdfData.product}`, 10, 70);
    doc.text(`Renter Email: ${pdfData.renter}`, 10, 80);
    doc.text(`Owner Email: ${pdfData.owner}`, 10, 90);
    doc.text(`Start Date: ${pdfData.start_date}`, 10, 100);
    doc.text(`End Date: ${pdfData.end_date}`, 10, 110);
    if (isInitial)
        doc.text(`Initial Payment: ${formatDollar(pdfData.initial_payment)}`, 10, 120);
    else
        doc.text(`Payment: ${formatDollar(pdfData.price)}`, 10, 120);
    doc.text(`Payments Remaining: ${pdfData.remaining}`, 10, 130);
    doc.save('rental-transaction.pdf');
}
