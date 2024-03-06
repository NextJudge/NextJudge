import Navbar from "@/components/navbar";
import * as React from "react"

// Import setup for creating a data table for user activities
// https://ui.shadcn.com/docs/components/data-table

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
 
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"



 // This needs to be authenticated with user data
// Returning page for users
const data: UserData[] = [
  {
    //id: "test",
    //status: "success",
    //email: "nextjudge@oregonstate.edu",
  }
]

export type UserData = {
    //id: string,
    //status: "success" | "failed",
    //email: string,
}



// This will take in user data but will not be processed here
// This is for visualization for preparing a route from backend data to here

// const data: UserSubmissions[] = [
  // {
  //   contest: "Beaver hacks",
  //   difficulty: "Easy",
  //   status: "In Progress",
  // },
  // {
  //   contest: "Beaver hacks",
  //   difficulty: "Easy",
  //   status: "In Progress",
  // },
  // {
  //   contest: "Beaver hacks",
  //   difficulty: "Easy",
  //   status: "In Progress",
  // },
// ]

// const type UserSubmissions = {
//   // contest: string,
//   // difficulty: string,
//   // status: "In Progress" | "Completed",
// }


export default function Home() {
  return (
    <>
      <Navbar />
      <div>
      <main className="flex flex-col items-center justify-between overflow-x-hidden">
          <div className='text-center text-7xl p-12'>
              Welcome back User!
          </div>
      </main>
      <section className="flex">
        <div className="text-4xl p-12">
          In Progress
        </div>

{/*        Develop Table for In Progress Here! */}

      </section>
      <section className="flex">
        <div className="text-4xl p-12">
          Recent Submissions
        </div>

{/*        Develop Table for Recent Submissions Here! */}

      </section>
      </div>
    </>
  );
}
