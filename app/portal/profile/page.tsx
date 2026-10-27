"use client";

import { ProfileForm } from "@/app/(components)/ProfileForm";
import MenuDrawer from "../MenuDrawer";
import { CalendarSyncCard } from "./CalendarSyncCard";

export default function ProfilePage() {
  return (
    <MenuDrawer>
      <ProfileForm />
      <CalendarSyncCard />
    </MenuDrawer>
  );
}
