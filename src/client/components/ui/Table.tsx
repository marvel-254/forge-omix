import React from 'react';
import { cn } from '../../lib/utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
  }>;
  data: Array<Record<string, any>>;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, columns, data, sortable, filterable, pagination, ...props }, ref) => {
    return (
      <div className="w-full overflow-auto">
        <table
          ref={ref}
          className={cn(
            'w-full caption-bottom text-sm',
            className
          )}
          {...props}
        >
          <thead className="[&_tr]:border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                {columns.map((column) => (
                  <td key={column.key} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

export { Table };
