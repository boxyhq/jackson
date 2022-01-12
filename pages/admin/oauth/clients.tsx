import { NextPage } from "next";

const OAuthClient: NextPage = () => {
  return (
    <div className="p-6">
      <table className="border-collapse w-full border-y border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 text-sm shadow-sm">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="w-1/2 border-b border-gray-300 dark:border-gray-600 font-semibold p-4 text-gray-900 dark:text-gray-200 text-left">
              Client
            </th>
            <th className="w-1/2 border-b border-gray-300 dark:border-gray-600 font-semibold p-4 text-gray-900 dark:text-gray-200 text-left">
              Product
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-b border-gray-100 dark:border-gray-700 p-4 text-gray-500 dark:text-gray-400">
              BoxyHQ
            </td>
            <td className="border-b border-gray-100 dark:border-gray-700 p-4 text-gray-500 dark:text-gray-400">
              CRM
            </td>
          </tr>
          <tr>
            <td className="border-b border-gray-100 dark:border-gray-700 p-4 text-gray-500 dark:text-gray-400">
              Acme Corp.
            </td>
            <td className="border-b border-gray-100 dark:border-gray-700 p-4 text-gray-500 dark:text-gray-400">
              CRM
            </td>
          </tr>
          <tr>
            <td className="border-b border-gray-100 dark:border-gray-700 p-4 text-gray-500 dark:text-gray-400">
              ABC Co.
            </td>
            <td className="border-b border-gray-100 dark:border-gray-700 p-4 text-gray-500 dark:text-gray-400">
              CRM
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default OAuthClient;
