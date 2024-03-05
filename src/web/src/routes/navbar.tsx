import React from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { title: "Problems", href: "Problems", description: "Problems List" },
  { title: "Contests", href: "Contests", description: "Contests List" },
];

const Navbar = () => {
  return (
    <div className="flex justify-between items-center p-5 w-full bg-black">
      <NavigationMenu>
        <NavigationMenuList className="flex items-center">
          <NavigationMenuLink href="Home" className="text-3xl pr-4">NextJudge</NavigationMenuLink>
          {navLinks.map((link) => (
            <NavigationMenuItem key={link.title}>
              <NavigationMenuTrigger className="text-3xl bg-black">{link.title}</NavigationMenuTrigger>
              <NavigationMenuContent className="p-4">
                <NavigationMenuLink href={link.href}>

                  {link.description}

                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="ml-auto text-3xl">
        <DropdownMenu>
          <DropdownMenuTrigger>Login</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Returning User</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>New User</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
