"use client";

import { ColumnDef } from "@tanstack/react-table";



import { Badge } from "@/components/ui/badge";
import { Problem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LockOpen1Icon } from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import { Lock } from "lucide-react";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export const createColumns = (onUpdate?: () => void, isAdmin: boolean = false): ColumnDef<Problem>[] => [
  {
    id: "index",
    header: () => (
      <div className="w-8 text-center font-medium px-2">
        #
      </div>
    ),
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex;
      const pageSize = table.getState().pagination.pageSize;
      const rowIndex = row.index + 1 + (pageIndex * pageSize);
      return (
        <div className="w-8 text-center text-sm text-muted-foreground px-2">
          {rowIndex}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    // Holy hack(s)
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Id" className="hidden" />
    ),
    cell: ({ row }) => <div className="hidden">{row.getValue("id")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" className="px-2 w-full" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 px-2 w-full">
          <span className="max-w-[400px] truncate font-medium">
            {row.getValue("title")}
          </span>
        </div>
      );
    },
  },

  {
    accessorKey: "difficulty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Difficulty" className="px-2" />
    ),
    cell: ({ row }) => {
      const difficulty = row.getValue("difficulty");
      return (
        <div className="flex items-center px-2">
          <span className="sr-only">{row.getValue("difficulty")}</span>
          <Badge
            variant={"outline"}
            className={cn({
              "border-[0.5px] border-red-500":
                difficulty === "VERY HARD" || difficulty === "HARD",
              "border-[0.5px] border-yellow-500": difficulty === "MEDIUM",
              "border-[0.5px] border-green-500": difficulty === "EASY",
              "border-[0.5px] border-blue-500": difficulty === "VERY EASY",
            })}
          >
            {row.getValue("difficulty")}
          </Badge>
        </div>
      );
    },
  },

  {
    accessorKey: "public",
    header: ({ column }) => (
      <div className={`${isAdmin ? "flex" : "hidden"} items-center justify-center w-16 px-2`}>
        Visibility
      </div>
    ),
    cell: ({ row }) => {
      const isPublic = row.getValue("public");
      return (
        <div className={`${isAdmin ? "flex" : "hidden"} items-center justify-center w-16 px-2`}>
          {!isPublic ? (
            <Lock className="w-4 h-4 text-muted-foreground" />
          ) : (
            <LockOpen1Icon className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      );
    },
  },

  // {
  //   accessorKey: "submissions",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Submissions" />
  //   ),
  //   cell: ({ row }: { row: any }) => {
  //     return (
  //       <div className="flex w-[120px] items-center">
  //         <span className="ml-2">
  //           {row.getValue("submissions").length > 0
  //             ? row.getValue("submissions").length
  //             : "None"}
  //         </span>
  //       </div>
  //     );
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id));
  //   },
  // },

  // {
  //   accessorKey: "users",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Author" />
  //   ),
  //   cell: ({ row }: { row: any }) => {
  //     return (
  //       <div className="flex w-[120px] items-center">
  //         <span className="ml-2">{row.getValue("users").name}</span>
  //       </div>
  //     );
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id));
  //   },
  // },

  {
    accessorKey: isAdmin ? "updated_at" : "upload_date",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={isAdmin ? "Last Updated" : "Upload Date"}
        className="px-2"
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue(isAdmin ? "updated_at" : "upload_date");

      if (!value) {
        return (
          <div className="w-[120px] whitespace-nowrap text-muted-foreground px-2">
            No date
          </div>
        );
      }

      try {
        const date = new Date(value as string);
        if (isNaN(date.getTime())) {
          return (
            <div className="w-[120px] whitespace-nowrap text-muted-foreground px-2">
              Invalid date
            </div>
          );
        }

        return (
          <div className="w-[120px] whitespace-nowrap px-2">
            {formatDistanceToNow(date, {
              addSuffix: true,
            })}
          </div>
        );
      } catch (error) {
        return (
          <div className="w-[120px] whitespace-nowrap text-muted-foreground px-2">
            Invalid date
          </div>
        );
      }
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div
          className={`${isAdmin ? "flex" : "hidden"} items-center space-x-2`}
        >
          <DataTableRowActions row={row} onUpdate={onUpdate} />
        </div>
      );
    },
  },
];

// Export backward compatible columns for non-admin usage
export const columns: ColumnDef<Problem>[] = createColumns(undefined, false);
