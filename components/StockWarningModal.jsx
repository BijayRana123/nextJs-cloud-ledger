import React from 'react';

const StockWarningModal = ({ 
  isOpen, 
  onClose, 
  onProceed, 
  onForceSubmit, 
  stockErrors = [], 
  stockWarnings = [],
  allowBypass = false 
}) => {
  if (!isOpen) return null;

  const hasErrors = stockErrors.length > 0;
  const hasWarnings = stockWarnings.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          {hasErrors ? (
            <div className="flex items-center text-red-600">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold">Insufficient Stock</h3>
            </div>
          ) : (
            <div className="flex items-center text-yellow-600">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold">Low Stock Warning</h3>
            </div>
          )}
        </div>

        <div className="mb-6">
          {hasErrors && (
            <div className="mb-4">
              <p className="text-red-700 font-medium mb-2">Cannot proceed with sale:</p>
              <ul className="space-y-2">
                {stockErrors.map((error, index) => (
                  <li key={index} className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                    <div className="font-medium text-red-800">{error.itemName}</div>
                    <div className="text-sm text-red-600">
                      Requested: {error.requestedQty}, Available: {error.currentStock}
                      {error.shortage && (
                        <span className="font-medium"> (Short by {error.shortage})</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasWarnings && (
            <div>
              <p className="text-yellow-700 font-medium mb-2">
                {hasErrors ? 'Additional warnings:' : 'Stock will be low after this sale:'}
              </p>
              <ul className="space-y-2">
                {stockWarnings.map((warning, index) => (
                  <li key={index} className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                    <div className="font-medium text-yellow-800">{warning.itemName}</div>
                    <div className="text-sm text-yellow-600">
                      Current: {warning.currentStock}, After sale: {warning.remainingAfterSale}
                      <span className="font-medium"> (Threshold: {warning.lowStockThreshold})</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          
          {!hasErrors && (
            <button
              onClick={onProceed}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Proceed Anyway
            </button>
          )}
          
          {hasErrors && !allowBypass && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Update Stock First
            </button>
          )}

          {hasErrors && allowBypass && (
            <button
              onClick={onForceSubmit}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Force Save (Allow Overselling)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockWarningModal;