// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

/*
    Upload Contract
    ----------------
    This contract allows users to upload files, share them with others (globally or per file),
    manage access permissions, and delete files logically (soft delete).
*/

contract Upload {
    // Struct to define access permissions
    struct Access {
        address user; // Address of the user
        bool access; // Whether the user has access or not
    }

    // Struct to define file properties
    struct File {
        string url; // File URL (assumed stored on IPFS or other off-chain storage)
        uint256 id; // Unique identifier of the file
        bool exists; // Whether the file exists (not deleted)
    }

    // Mapping of user => list of their files
    mapping(address => File[]) private value;

    // Mapping of owner => viewer => global access permission
    mapping(address => mapping(address => bool)) private ownership;

    // Mapping of owner => list of users with global access (for UI/management)
    mapping(address => Access[]) private accessList;

    // Mapping to track if a user was ever in the accessList (avoid duplicate entries)
    mapping(address => mapping(address => bool)) private previousData;

    // === Per-file access control ===

    // Mapping of owner => fileId => viewer => access permission
    mapping(address => mapping(uint256 => mapping(address => bool)))
        private fileAccess;

    // Mapping of owner => fileId => list of users with access to that file
    mapping(address => mapping(uint256 => Access[])) private fileAccessList;

    // Mapping to track how many files a user has uploaded (used for unique file IDs)
    mapping(address => uint256) private fileIdCounter;

    // Function to add/upload a file for a user
    function add(address _user, string memory url) external {
        uint256 fileId = fileIdCounter[_user]; // get next file ID
        value[_user].push(File(url, fileId, true)); // add file to user list
        fileIdCounter[_user]++; // increment file ID counter
    }

    // Function to give global access to another user (view all current & future files)
    function allow(address user) external {
        ownership[msg.sender][user] = true;

        if (previousData[msg.sender][user]) {
            // If user was already in list, update their access to true
            for (uint i = 0; i < accessList[msg.sender].length; i++) {
                if (accessList[msg.sender][i].user == user) {
                    accessList[msg.sender][i].access = true;
                }
            }
        } else {
            // New user to the list
            accessList[msg.sender].push(Access(user, true));
            previousData[msg.sender][user] = true;
        }
    }

    // Function to revoke global access
    function disallow(address user) public {
        ownership[msg.sender][user] = false;

        // Update accessList
        for (uint i = 0; i < accessList[msg.sender].length; i++) {
            if (accessList[msg.sender][i].user == user) {
                accessList[msg.sender][i].access = false;
            }
        }
    }

    // Allow access to a specific file for a user
    function allowFile(address user, uint256 fileId) external {
        // Check if file exists
        bool fileFound = false;
        for (uint i = 0; i < value[msg.sender].length; i++) {
            if (
                value[msg.sender][i].id == fileId && value[msg.sender][i].exists
            ) {
                fileFound = true;
                break;
            }
        }
        require(fileFound, "File does not exist");

        // Set access permission
        fileAccess[msg.sender][fileId][user] = true;

        // Update or add user to fileAccessList
        bool userExists = false;
        for (uint i = 0; i < fileAccessList[msg.sender][fileId].length; i++) {
            if (fileAccessList[msg.sender][fileId][i].user == user) {
                fileAccessList[msg.sender][fileId][i].access = true;
                userExists = true;
                break;
            }
        }

        if (!userExists) {
            fileAccessList[msg.sender][fileId].push(Access(user, true));
        }
    }

    // Revoke access to a specific file
    function disallowFile(address user, uint256 fileId) external {
        fileAccess[msg.sender][fileId][user] = false;

        // Update access list entry
        for (uint i = 0; i < fileAccessList[msg.sender][fileId].length; i++) {
            if (fileAccessList[msg.sender][fileId][i].user == user) {
                fileAccessList[msg.sender][fileId][i].access = false;
                break;
            }
        }
    }

    // Soft delete a file (mark exists as false)
    function deleteFile(uint256 fileId) external {
        bool fileFound = false;

        for (uint i = 0; i < value[msg.sender].length; i++) {
            if (
                value[msg.sender][i].id == fileId && value[msg.sender][i].exists
            ) {
                value[msg.sender][i].exists = false;
                fileFound = true;
                break;
            }
        }

        require(fileFound, "File not found or already deleted");

        // Optionally remove all per-file access (commented out to save gas)
    }

    // Display all files of a user that current caller is allowed to see
    function display(address _user) external view returns (File[] memory) {
        require(
            _user == msg.sender || ownership[_user][msg.sender],
            "You don't have access"
        );

        // Count non-deleted files
        uint256 existingFileCount = 0;
        for (uint i = 0; i < value[_user].length; i++) {
            if (value[_user][i].exists) {
                existingFileCount++;
            }
        }

        // Create and return filtered file list
        File[] memory existingFiles = new File[](existingFileCount);
        uint256 currentIndex = 0;

        for (uint i = 0; i < value[_user].length; i++) {
            if (value[_user][i].exists) {
                existingFiles[currentIndex] = value[_user][i];
                currentIndex++;
            }
        }

        return existingFiles;
    }

    // Display only files that have been shared with you specifically (not global access)
    function displaySharedFiles(
        address owner
    ) external view returns (File[] memory) {
        File[] memory allFiles = value[owner];
        uint256 sharedFileCount = 0;

        for (uint i = 0; i < allFiles.length; i++) {
            if (
                allFiles[i].exists &&
                fileAccess[owner][allFiles[i].id][msg.sender]
            ) {
                sharedFileCount++;
            }
        }

        File[] memory sharedFiles = new File[](sharedFileCount);
        uint256 currentIndex = 0;

        for (uint i = 0; i < allFiles.length; i++) {
            if (
                allFiles[i].exists &&
                fileAccess[owner][allFiles[i].id][msg.sender]
            ) {
                sharedFiles[currentIndex] = allFiles[i];
                currentIndex++;
            }
        }

        return sharedFiles;
    }

    // Return global access list of users for the current sender
    function shareAccess() public view returns (Access[] memory) {
        return accessList[msg.sender];
    }

    // Return per-file access list of users
    function getFileAccessList(
        uint256 fileId
    ) public view returns (Access[] memory) {
        return fileAccessList[msg.sender][fileId];
    }

    // Return all non-deleted files uploaded by the current user
    function getAllFiles() public view returns (File[] memory) {
        uint256 existingFileCount = 0;
        for (uint i = 0; i < value[msg.sender].length; i++) {
            if (value[msg.sender][i].exists) {
                existingFileCount++;
            }
        }

        File[] memory existingFiles = new File[](existingFileCount);
        uint256 currentIndex = 0;

        for (uint i = 0; i < value[msg.sender].length; i++) {
            if (value[msg.sender][i].exists) {
                existingFiles[currentIndex] = value[msg.sender][i];
                currentIndex++;
            }
        }

        return existingFiles;
    }
}
