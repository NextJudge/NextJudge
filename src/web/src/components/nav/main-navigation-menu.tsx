import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { directoryRoutes, platformRoutes } from "@/lib/constants";
import { Session } from "next-auth";
import { Pyramid } from "lucide-react";

export function MainNavigationMenu({ session }: { session: Session | undefined }) {
  const infos = directoryRoutes.infosNav[0];

  // filter out admin routes for non-admin users
  const filteredPlatformRoutes = platformRoutes.filter((route) => {
    if (route.href.includes('/admin')) {
      return session?.user?.is_admin === true;
    }
    return true;
  });

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>{infos.title}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <a
                  className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                  href={`/platform/problems/random`}
                >
                  <Pyramid className="w-10 h-10" />
                  <div className="mb-2 mt-3 text-lg font-medium text-gradient_blaze-orange">
                    Jump right in!
                  </div>
                  <p className="text-sm leading-tight text-muted-foreground">
                    Go straight to our first problem and start solving!
                  </p>
                </a>
              </li>
              {infos.items?.map((info) => (
                <li key={info.title}>
                  <ListItem key={info.title} {...info} />
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        {/* holy hack */}
        {filteredPlatformRoutes.map((link) => (
          <NavigationMenuItem key={link.label}>
            <a href={link.href} className={navigationMenuTriggerStyle()}>
              {link.label}
            </a>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem: React.FC<any> = ({
  title,
  href,
  description,
  disabled,
  external,
}) => {
  const target = external ? "_blank" : undefined;

  return (
    <a
      href={disabled ? undefined : href}
      target={target}
      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:text-muted-foreground disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
    >
      <div className="flex items-center justify-between">
        <span className="mr-2">{title}</span>
      </div>
      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
        {description}
      </p>
    </a>
  );
};

ListItem.displayName = "ListItem";
