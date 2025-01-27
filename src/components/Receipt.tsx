import React from 'react';
import { Order } from '../types';

interface ReceiptProps {
  order: Order;
  onClose: () => void;
}

export function Receipt({ order, onClose }: ReceiptProps) {
  const printReceipt = () => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const date = new Date(order.createdAt);
    const formattedDate = date.toLocaleDateString('pt-BR');
    const formattedTime = date.toLocaleTimeString('pt-BR');

    const paymentMethodLabels = {
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      pix: 'PIX',
      cash: 'Dinheiro',
      'meal-ticket': 'Vale Refeição',
    };

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nota Fiscal - Mesa ${order.tableNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
              width: 300px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .info {
              margin-bottom: 20px;
            }
            .items {
              margin-bottom: 20px;
            }
            .item {
              margin-bottom: 10px;
            }
            .total {
              border-top: 1px dashed #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            @media print {
              body { width: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>RESTAURANTE EXEMPLO</h2>
            <p>CNPJ: 00.000.000/0000-00</p>
            <p>Rua Exemplo, 123 - Centro</p>
            <p>CEP: 00000-000 - Cidade/UF</p>
          </div>

          <div class="info">
            <p>Data: ${formattedDate}</p>
            <p>Hora: ${formattedTime}</p>
            <p>Mesa: ${order.tableNumber}</p>
            <p>Pedido: #${order.id.slice(0, 8)}</p>
          </div>

          <div class="items">
            <h3>ITENS DO PEDIDO</h3>
            ${order.items.map(item => `
              <div class="item">
                <p>${item.quantity}x ${item.name}</p>
                <p>R$ ${(item.price * item.quantity).toFixed(2)}</p>
                ${item.notes ? `<p>Obs: ${item.notes}</p>` : ''}
                ${item.meatPoint ? `<p>Ponto: ${item.meatPoint}</p>` : ''}
                ${item.removedItems?.length ? `<p>Remover: ${item.removedItems.join(', ')}</p>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="total">
            <h3>TOTAL: R$ ${order.total.toFixed(2)}</h3>
            ${order.paymentMethod ? `<p>Forma de Pagamento: ${paymentMethodLabels[order.paymentMethod]}</p>` : ''}
            ${order.paidAmount ? `
              <p>Valor Pago: R$ ${order.paidAmount.toFixed(2)}</p>
              <p>Troco: R$ ${(order.paidAmount - order.total).toFixed(2)}</p>
            ` : ''}
          </div>

          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>Volte sempre!</p>
          </div>
        </body>
      </html>
    `;

    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Imprimir Nota Fiscal</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Mesa #{order.tableNumber}</span>
              <span className="text-gray-600">
                {new Date(order.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              Total: R$ {order.total.toFixed(2)}
            </div>
          </div>

          <button
            onClick={printReceipt}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Imprimir Nota Fiscal</span>
          </button>
        </div>
      </div>
    </div>
  );
}