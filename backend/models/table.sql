-- Disable foreign key checks temporarily to avoid issues during table creation order
SET FOREIGN_KEY_CHECKS = 0;

-- Table for Organizations
CREATE TABLE organization_onboarded (
    organization_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE, -- Company name
    official_email VARCHAR(255) UNIQUE, -- Main contact email for the organization
    phone_number VARCHAR(50),
    website VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    logo_url VARCHAR(255), -- Optional: URL to organization's logo
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active', -- To manage active customers
    industry_type VARCHAR(100),
    company_size_range VARCHAR(50), -- e.g., "1-50", "51-200", "201-500", "500+"
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INT, -- Optional: Who (superadmin) onboarded this org
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL -- For soft deletes of the organization itself
);

-- Table for Users within Organizations
CREATE TABLE users_onboarded (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL, -- Foreign Key to organization_onboarded
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    official_email_id VARCHAR(255) NOT NULL UNIQUE, -- Primary email for login (unique globally recommended)
    secondary_email_id VARCHAR(255),
    contact_number VARCHAR(50),
    role ENUM('admin', 'manager', 'member') NOT NULL, -- User's role within their organization
    password_hash VARCHAR(255) NOT NULL, -- Hashed password using bcrypt
    invite_token VARCHAR(255) NULL, -- Token for initial password setup or invite
    temp_password_expires DATETIME NULL, -- Expiry for the invite/reset token
    status ENUM('active', 'invited', 'pending_approval', 'suspended', 'deleted') DEFAULT 'invited', -- User's lifecycle status
    profile_picture_url VARCHAR(255),

    -- Demographic & Personal Details
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
    nationality VARCHAR(100),
    marital_status VARCHAR(50),
    blood_group VARCHAR(10),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    father_name VARCHAR(255),
    mother_name VARCHAR(255),

    -- emergency contact details
    emergency_contact_name VARCHAR(255),
    emergency_contact_number VARCHAR(50),
    emergency_contact_email VARCHAR(255)
    emergency_contact_relation VARCHAR(255),

    -- Employment Details
    employee_id VARCHAR(50) UNIQUE, -- Internal company employee ID
    date_of_joining DATE,
    designation VARCHAR(100),
    department VARCHAR(100),
    manager_id INT NULL, -- Self-referencing FK to user_id for manager hierarchy
    employment_type ENUM('Full-time', 'Part-time', 'Contractor', 'Intern'),
    work_location VARCHAR(255), -- Physical office, remote, 
     notes TEXT,
     about_me TEXT,
     bio TEXT,

    -- Financial Details
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    ifsc_code VARCHAR(50),
    pan_number VARCHAR(20), -- For India
    aadhaar_number VARCHAR(20), -- For India
    voter_id VARCHAR(50) UNIQUE,

    -- social media
     facebook_url VARCHAR(255),
     x_url VARCHAR(255),
     linkedin_url VARCHAR(255),
     instagram_url VARCHAR(255),

    -- Audit & Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL, -- For soft deletes of user accounts

    FOREIGN KEY (organization_id) REFERENCES organization_onboarded(organization_id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users_onboarded(user_id) ON DELETE SET NULL
);

--  user education detail table 
CREATE TABLE `user_education` (
  education_id INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `organization_id` INT NOT NULL,

  -- AISCE (10th)
  `aisce_board` VARCHAR(255),
  `aisce_shcool` VARCHAR(255),
  `aisce_percentage` Float(20),
  `aisce_year` INT,

  -- AISSCE (12th)
  `aissce_board` VARCHAR(255),
  `aissce_college` VARCHAR(255),
  `aissce_stream` VARCHAR(255),
  `aissce_percentage` Float(20),
  `aissce_year` INT,

  -- Graduation
  `graduation_university` VARCHAR(255),
  `graduation_college` VARCHAR(255),
  `graduation_stream` VARCHAR(255),
  `graduation_percentage` Float(20),
  `graduation_year` INT,

  -- Postgraduation
  `postgraduation_university` VARCHAR(255),
  `posrgraduation_college` VARCHAR(255),
  `postgraduation_stream` VARCHAR(255),
  `postgraduation_percentage` Float(20),
  `postgraduation_year` INT,

  -- Doctorate
  `doctorate_university` VARCHAR(255),
  `doctarate_college` VARCHAR(255),
  `doctorate_stream` VARCHAR(255),
  `doctarate_percentage` Float(20),
  `doctorate_year` INT,

  -- Others
  `others_education_university` VARCHAR(255),
  `others_education_college` VARCHAR(255),
  `others_education_stream` VARCHAR(255),
  `others_education_percentage` VARCHAR(255),
  `others_education_year` INT,

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,

  CONSTRAINT `fk_user_education_user` FOREIGN KEY (`user_id`) REFERENCES `users_onboarded`(`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_education_org` FOREIGN KEY (`organization_id`) REFERENCES `organization_onboarded`(`organization_id`) ON DELETE CASCADE
);

-- user work experience table
CREATE TABLE `user_work_experience` (
  `work_experience_id` INT AUTO_INCREMENT PRIMARY KEY,

  `user_id` INT NOT NULL,
  `organization_id` INT NOT NULL,

  `company_name` VARCHAR(255) NOT NULL,
  `company_url` VARCHAR(255),
  `work_from` DATE NOT NULL,
  `work_to` DATE,
  `contact_number` VARCHAR(50),
  `contact_email` VARCHAR(255),
  `letter` VARCHAR(255),

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,

  CONSTRAINT `fk_user_work_exp_user` FOREIGN KEY (`user_id`) REFERENCES `users_onboarded`(`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_work_exp_org` FOREIGN KEY (`organization_id`) REFERENCES `organization_onboarded`(`organization_id`) ON DELETE CASCADE
);




-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;


-- Note:

-- ON DELETE CASCADE for organization_id means if an organization is deleted, all its users are also deleted. Be careful with this; for soft deletes, you'd manage this via deleted_at flags.
-- ON DELETE SET NULL for manager_id means if a manager user is deleted, their direct reports will have their manager_id set to NULL.
-- Many fields like education, past experience, and family details are often better handled in separate, related tables if they are complex (e.g., multiple degrees, multiple past jobs). For simplicity here, I've kept them in users_onboarded but flagged them for future normalization.