/**
 * Navigation — derives NavItems from the content service.
 *
 * Components should import NAV_ITEMS from here (same API as before).
 * Under the hood it now reads from modules.json via content-service.
 */

import { getNavItems } from "@/domains/sections/services/content.service";
import type { NavItem } from "@/shared/types";

export const NAV_ITEMS: NavItem[] = getNavItems();
