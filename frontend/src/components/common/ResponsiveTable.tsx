import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
}

export function ResponsiveTable<T>({ 
  data, 
  columns, 
  keyExtractor,
  className = '' 
}: ResponsiveTableProps<T>) {
  const getCellValue = (item: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor] as React.ReactNode;
  };

  return (
    <>
      {/* Desktop Table */}
      <div className={`hidden md:block overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={keyExtractor(item, index)}>
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                  >
                    {getCellValue(item, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={`md:hidden space-y-4 ${className}`}>
        {data.map((item, index) => (
          <div
            key={keyExtractor(item, index)}
            className="bg-white shadow rounded-lg p-4 space-y-2"
          >
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-500">
                  {column.header}:
                </span>
                <span className="text-sm text-gray-900 text-right ml-2">
                  {getCellValue(item, column)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
} 