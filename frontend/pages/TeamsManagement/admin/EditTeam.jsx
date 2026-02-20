
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import MemberSelectorModal from '../../../components/team/MemberSelectorModal';

const EditTeam = () => {
  const { id: teamId } = useParams(); // get teamId from URL param
  console.log("EditTeam: teamId param is", teamId);
  const [team, setTeam] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [managerList, setManagerList] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_id: '',
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!teamId) return;

    const fetchTeam = async () => {
      try {
        console.log("Fetching team with id:", teamId);
        const res = await axios.get(`/api/admin/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTeam(res.data);
        setFormData({
          name: res.data.name || '',
          description: res.data.description || '',
          manager_id: res.data.manager_id || '',
        });

        // Extract user IDs from members array
        const memberIds = res.data.members?.map((m) => m.user.user_id) || [];
        setMembers(memberIds);
      } catch (error) {
        console.error('Failed to load team:', error);
      }
    };

    fetchTeam();

    
  }, [teamId, token]);

  useEffect(() => {
  const fetchManagers = async () => {
    try {
      const res = await axios.get('/api/users?role=manager', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.users || res.data?.managers || res.data;
if (Array.isArray(data)) {
  setManagerList(data);
} else {
  console.warn("⚠️ Unexpected manager list response:", res.data);
  setManagerList([]);
}


    } catch (err) {
      console.error('Failed to fetch managers:', err);
    }
  };

  fetchManagers();
}, [token]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = () => setShowMemberModal(true);
  const handleCloseModal = () => setShowMemberModal(false);

  const handleConfirmMembers = (selectedMemberIds) => {
    setMembers(selectedMemberIds);
    setShowMemberModal(false);
  };

  const handleSubmit = async () => {
  try {
    await axios.patch(
      `/api/admin/teams/${teamId}`,
      {
        ...formData,
        members: members.map((id) => ({ user_id: id })),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    alert('Team updated successfully!');
  } catch (error) {
    console.error('Failed to update team:', error);
    alert('Failed to update team. Please try again.');
  }
};


  if (!teamId) return <p>Please select a team to edit.</p>;
  if (!team) return <p>Loading team data...</p>;

  return (
    <>
    <ComponentCard>
      <h2 className="text-xl font-semibold mb-4">Edit Team: {team.name}</h2>

      <label className="block mb-2 font-medium text-gray-700 dark:text-white">Team Name</label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        className="w-full p-2 mb-4 border rounded dark:bg-gray-800 dark:text-white"
      />

      <label className="block mb-2 font-medium text-gray-700 dark:text-white">Description</label>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        rows="3"
        className="w-full p-2 mb-4 border rounded dark:bg-gray-800 dark:text-white"
      />

      <label className="block mb-2 font-medium text-gray-700 dark:text-white">Manager</label>
      <select
  name="manager_id"
  value={formData.manager_id}
  onChange={handleInputChange}
  className="w-full p-2 mb-4 border rounded dark:bg-gray-800 dark:text-white"
>
  <option value="">-- Select Manager --</option>

  {Array.isArray(managerList) && managerList.map((manager) => (
    <option key={manager.user_id} value={manager.user_id}>
      {manager.first_name} {manager.last_name}
    </option>
  ))}
</select>



      <div>
        <h3 className="mb-2 font-semibold dark:text-white">Team Members</h3>
        <Button onClick={handleOpenModal}>+ Add / Remove Members</Button>
        {members.length > 0 ? (
          <ul className="mt-2 max-h-40 overflow-auto border p-2 rounded dark:bg-gray-800 dark:text-white">
            {members.map((id) => (
              <li key={id}>{id}</li> 
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-gray-500 dark:text-gray-400">No members assigned.</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save Changes
      </button>

      
    </ComponentCard>
    <MemberSelectorModal
        isOpen={showMemberModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmMembers}
        preSelected={members}
      />
      </>
  );
};

export default EditTeam;
