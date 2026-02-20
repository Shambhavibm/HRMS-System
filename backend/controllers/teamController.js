const { teams, team_members, User } = require('../models');

exports.createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { organization_id } = req.user;

    const team = await teams.create({ name, description, organization_id });
    res.status(201).json(team);
  } catch (err) {
    console.error("Error creating team:", err);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

exports.assignMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const members = req.body.members || req.body.member_ids || [];

    if (!Array.isArray(members)) {
      return res.status(400).json({ error: 'Expected members as an array' });
    }

    const team = await teams.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const managerId = team.manager_id;

    // 🔄 Fetch existing members
    const existing = await team_members.findAll({
      where: { team_id: teamId },
      attributes: ['user_id']
    });

    const existingIds = existing.map((m) => m.user_id);
    const newIds = members.map((m) => (typeof m === 'object' ? m.user_id : m));

    // ➕ Filter only unique (non-existing) new members
    const uniqueNewIds = newIds.filter((id) => !existingIds.includes(id));

    if (uniqueNewIds.length === 0) {
      return res.status(200).json({ message: 'No new members to add.' });
    }

    const memberInserts = uniqueNewIds.map((id) => ({
      team_id: teamId,
      user_id: id,
      role_in_team: 'member',
      organization_id: req.user.organization_id,
    }));

    await team_members.bulkCreate(memberInserts);

    // 👤 Update manager_id_primary if needed
    if (managerId && uniqueNewIds.length > 0) {
      await User.update(
        { manager_id_primary: managerId },
        { where: { user_id: uniqueNewIds } }
      );
    }

    res.json({ message: '✅ Members added successfully.', added: uniqueNewIds.length });
  } catch (err) {
    console.error('❌ Error assigning members:', err);
    res.status(500).json({ error: 'Failed to assign team members.' });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    const orgId = req.user.organization_id;

    const data = await teams.findAll({
      where: { organization_id: orgId },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['user_id', 'first_name', 'last_name', 'official_email_id']
        },
        {
          model: team_members,
          as: 'members', // ✅ Fixed alias to match association
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'first_name', 'last_name', 'official_email_id']
            }
          ]
        }
      ]
    });

    res.json(data);
  } catch (err) {
    console.error('❌ Fetch teams error:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, manager_id, members } = req.body;
    const { organization_id } = req.user;

    // Step 1: Update team basic info
    await teams.update(
      { name, description, manager_id },
      { where: { id } }
    );

    // Step 2: Remove previous members
    await team_members.destroy({ where: { team_id: id } });

    // Step 3: Re-add all members
    if (Array.isArray(members) && members.length > 0) {
      const formattedMembers = members.map((member) => ({
        team_id: id,
        user_id: member.user_id,
        role_in_team: member.role || 'member',
        organization_id,
      }));

      await team_members.bulkCreate(formattedMembers);

      const userIds = formattedMembers.map((m) => m.user_id);
      if (manager_id) {
        await User.update(
          { manager_id_primary: manager_id },
          { where: { user_id: userIds } }
        );
      }
    }

    return res.status(200).json({ message: '✅ Team and members updated successfully.' });
  } catch (err) {
    console.error('❌ Error updating team:', err);
    return res.status(500).json({ error: 'Failed to update team.' });
  }
};

exports.getTeamsManagedByMe = async (req, res) => {
  try {
    const { userId, organization_id } = req.user;

    const teamsManaged = await teams.findAll({
      where: {
        manager_id: userId,
        organization_id: organization_id
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['user_id', 'first_name', 'last_name', 'official_email_id']
        },
        {
          model: team_members,
          as: 'members', // ✅ Fixed alias to match association
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'first_name', 'last_name', 'official_email_id']
            }
          ]
        }
      ]
    });

    res.json(teamsManaged);
  } catch (err) {
    console.error("❌ Fetch manager teams error:", err);
    res.status(500).json({ error: 'Failed to fetch your managed teams' });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.organization_id;

    const team = await teams.findOne({
      where: { id, organization_id: orgId },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['user_id', 'first_name', 'last_name', 'official_email_id'],
        },
        {
          model: team_members,
          as: 'members', // ✅ Fixed alias to match association
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'first_name', 'last_name', 'official_email_id'],
            },
          ],
        },
      ],
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (err) {
    console.error('Error fetching team by id:', err);
    res.status(500).json({ error: 'Failed to fetch team.' });
  }
};
