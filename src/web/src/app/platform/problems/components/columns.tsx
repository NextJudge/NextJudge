"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/checkbox";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

let isAdmin = false;
if (typeof window !== "undefined") {
  const location = window.location.href;
  if (location.includes("admin")) isAdmin = true;
}

// TODO: Type this correctly.
export const columns: ColumnDef<any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
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
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
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
      <DataTableColumnHeader column={column} title="Difficulty" />
    ),
    cell: ({ row }) => {
      const difficulty = row.getValue("difficulty");
      return (
        <div className="flex items-center">
          <span className="sr-only">{row.getValue("difficulty")}</span>
          <Badge
            variant={"outline"}
            className={cn({
              "border-[0.5px] border-red-500":
                difficulty === "VERY_HARD" || difficulty === "HARD",
              "border-[0.5px] border-yellow-500": difficulty === "MEDIUM",
              "border-[0.5px] border-green-500":
                difficulty === "EASY" || difficulty === "VERY_EASY",
            })}
          >
            {row.getValue("difficulty")}
          </Badge>
        </div>
      );
    },
  },

  {
    accessorKey: "submissions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Submissions" />
    ),
    cell: ({ row }: { row: any }) => {
      return (
        <div className="flex w-[120px] items-center">
          <span className="ml-2">
            {row.getValue("submissions").length > 0
              ? row.getValue("submissions").length
              : "None"}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },

  {
    accessorKey: "users",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Author" />
    ),
    cell: ({ row }: { row: any }) => {
      return (
        <div className="flex w-[120px] items-center">
          <span className="ml-2">{row.getValue("users").name}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },

  {
    accessorKey: "upload_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Upload Date" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("upload_date");
      return (
        <div className="w-[100px]">
          {formatDistanceToNow(new Date(value as any), {
            addSuffix: true,
          })}
        </div>
      );
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
          <DataTableRowActions row={row} />
        </div>
      );
    },
  },
];
