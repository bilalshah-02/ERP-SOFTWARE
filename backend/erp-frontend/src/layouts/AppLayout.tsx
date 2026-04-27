import { Outlet } from "react-router-dom";
import Sidebar from "./SideBar";
import Header from "./Header";

export default function AppLayout() {
  return (
    <>
      <Sidebar />
      <Header />
      <div id="main">
        <div className="main-inner">
          <Outlet />
        </div>
      </div>
    </>
  );
}
