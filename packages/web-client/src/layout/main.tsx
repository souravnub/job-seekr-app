import { NavLink, Outlet } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { meQueryOptions } from "../lib/api";

export default function MainLayout() {
  const meQuery = useQuery(meQueryOptions);

  const handleExport = async () => {
    const resp = await fetch('/api/export');
    const rawData = await resp.blob();
    const newBlob = new Blob([rawData]);
    const blobUrl = window.URL.createObjectURL(newBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `export-${Date.now()}.pdf`);
    link.click();
    window.URL.revokeObjectURL(blobUrl);
  }

  if (meQuery.isLoading || !meQuery.data) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <aside className="flex flex-col gap-4 p-4 bg-gray-50">
        <div className="flex-1">
          <h3 className="font-bold text-2xl mb-6">Job Seekr</h3>
          {'error' in meQuery.data && (
            <div className="flex gap-2">
              <a href="/api/auth/login" className="btn green">
                Login
              </a>
            </div>
          )}
          {'user' in meQuery.data && (
            <div className="flex flex-col gap-2">
              <NavLink to="/" className="btn green">
                My applications
              </NavLink>
              <NavLink to="/application/new" className="btn green">
                Add application
              </NavLink>
              <button className="btn green" onClick={() => handleExport()}>
                Export PDF
              </button>
              <a href="/api/auth/logout" className="btn green">
                Logout
              </a>
            </div>
          )}
        </div>
        <footer className="page-footer">
          <p><NavLink to="/about">Read more about this project.</NavLink></p>
          <p className="text-sm">
            Developed by <a href="https://www.linkedin.com/in/ivandemchenko/" target="_blank">Ivan Demchenko</a>
          </p>
          <p className="text-sm">
            <a href="https://github.com/ivan-demchenko/job-seekr-app" target="_blank">View it on GitHub</a> or <a href="https://buymeacoffee.com/ivan.demchenko" target="_blank">support the project</a>
          </p>
        </footer>
      </aside>

      <main className="p-4 flex-1 overflow-auto">
        {'error' in meQuery.data
          ? <p>Please, <a href="/api/auth/login">login</a> first</p>
          : <Outlet />
        }
      </main>
    </>
  );
}