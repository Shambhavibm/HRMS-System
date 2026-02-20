
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ComponentCard from '../../../components/common/ComponentCard';
import Input from '../../../components/form/input/Input';
import Button from '../../../components/ui/button/Button';

const CreateTeam = () => {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.warning("Team name is required.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/teams', {
        name: teamName,
        description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Team created successfully!");
      setTeamName('');
      setDescription('');
    } catch (error) {
      console.error(error);
      toast.error("Failed to create team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard>
      <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">Create a New Team</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Input
          label="Team Name"
          placeholder="Enter team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
        />

        <Input
          label="Description"
          placeholder="Enter team description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button onClick={handleCreateTeam} loading={loading}>
        Create Team
      </Button>
    </ComponentCard>
  );
};

export default CreateTeam;
