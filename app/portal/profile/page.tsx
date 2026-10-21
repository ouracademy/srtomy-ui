"use client";

import { ProfileForm } from "@/app/(components)/ProfileForm";
import MenuDrawer from "../MenuDrawer";

export default function ProfilePage() {
  return (
    <MenuDrawer>
      <ProfileForm />
    </MenuDrawer>
  );
}
