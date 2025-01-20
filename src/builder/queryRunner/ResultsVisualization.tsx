// ResultsVisualization.tsx
import React, { useMemo } from 'react';
import { DataGrid, DataGridComponents, Flex } from '@neo4j-ndl/react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
} from '@tanstack/react-table';

interface ResultsVisualizationProps {
  data: Array<Record<string, any>>;
}

export default function ResultsVisualization({ data }: ResultsVisualizationProps) {
  const columns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    if (data.length === 0) return [];
    
    // Dynamically create columns based on data keys
    const keys = Object.keys(data[0]);
    return keys.map((key) => ({
      accessorKey: key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      cell: (info) => {
        const value = info.getValue();
        
        // Handle array values
        if (Array.isArray(value)) {
          return (
            <Flex>
              {value.map((item, index) => (
                <span key={index} style={{ marginRight: '4px' }}>
                  {typeof item === 'object' ? JSON.stringify(item) : item}
                </span>
              ))}
            </Flex>
          );
        }
        
        // Handle object values
        if (typeof value === 'object' && value !== null) {
          return <span>{JSON.stringify(value)}</span>;
        }
        
        // Handle primitive values
        return <span>{value?.toString()}</span>;
      },
    }));
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid
      tableInstance={table}
      styling={{
        borderStyle: 'all-sides',
        hasZebraStriping: true,
        headerStyle: 'clean',
      }}
      rootProps={{
        className: 'max-h-[400px] overflow-y-auto',
      }}
      components={{
        Body: () => (
          <DataGridComponents.Body
            innerProps={{
              className: 'tbody-light',
            }}
          />
        ),
      }}
    />
  );
}