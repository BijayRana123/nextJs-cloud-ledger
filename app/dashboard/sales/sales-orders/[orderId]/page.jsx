import React from 'react';

const SalesOrderDetailPage = ({ params }) => {
  const { orderId } = params;

  return (
    <div>
      <h1>Sales Order Detail for ID: {orderId}</h1>
      {/* Add your component logic here to fetch and display sales order details */}
    </div>
  );
};

export default SalesOrderDetailPage;
