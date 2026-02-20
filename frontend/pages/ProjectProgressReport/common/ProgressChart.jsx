
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns"; 
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
//
const ProgressChart = ({ projectId, token }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!projectId) {
      console.warn("ProgressChart: projectId is undefined or null. Skipping API call.");
      return;
    }
    axios.get(`/api/projects/${projectId}/progress-timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, [projectId, token]);

  return (
    <div className="my-4">
      <h3 className="text-lg font-semibold mb-2">Progress Timeline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="date" 
          tickFormatter={(tick) => {
              try {
                return format(parseISO(tick), "dd-MM-yyyy");
              } catch {
                return tick;
              }
            }}
            />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <Line type="monotone" dataKey="progress" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;
