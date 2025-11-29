import React from "react";

const ActivityList = ({ activities }) => {
  return (
    <div className="bg-white p-6 shadow-md rounded-xl">
      <h2 className="text-lg font-bold text-blue-700 mb-4">Recent Activities</h2>
      <ul>
        {activities.map((a, i) => (
          <li key={i} className="border-b py-2 text-gray-700">
            {a.description} – <span className="text-sm text-gray-500">{new Date(a.timestamp).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityList;
