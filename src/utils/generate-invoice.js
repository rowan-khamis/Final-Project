import PDFDocument from 'pdfkit';

// Utility function to generate PDF invoice
const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument();

      // Set up stream to collect PDF data
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add content to the PDF
      doc.fontSize(12);
      doc.text('Invoice for Order #' + order.orderNumber);
      doc.moveDown();
      doc.text('Customer: ' + order.customerName);
      doc.text('Email: ' + order.customerEmail);
      doc.text('Order Date: ' + order.createdAt.toLocaleDateString());
      doc.moveDown();
      doc.text('Order Details:');
      order.items.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.productName} - ${item.quantity} x ${item.price}`);
      });
      doc.moveDown();
      doc.text('Total Amount: ' + order.totalAmount);

      // End the document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default generateInvoicePDF;