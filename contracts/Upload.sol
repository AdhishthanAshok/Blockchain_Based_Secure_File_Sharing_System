// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Upload {
    struct Access {
        address user;
        bool access; // true or false
    }

    struct File {
        string url;
        uint256 id;
        bool exists; // Track if file exists or was deleted
    }

    mapping(address => File[]) private value;
    mapping(address => mapping(address => bool)) private ownership;
    mapping(address => Access[]) private accessList;
    mapping(address => mapping(address => bool)) private previousData;

    // New mappings for per-file access
    mapping(address => mapping(uint256 => mapping(address => bool)))
        private fileAccess;
    mapping(address => mapping(uint256 => Access[])) private fileAccessList;

    // File counter to generate unique IDs
    mapping(address => uint256) private fileIdCounter;

    function add(address _user, string memory url) external {
        uint256 fileId = fileIdCounter[_user];
        value[_user].push(File(url, fileId, true));
        fileIdCounter[_user]++;
    }

    function allow(address user) external {
        ownership[msg.sender][user] = true;
        if (previousData[msg.sender][user]) {
            for (uint i = 0; i < accessList[msg.sender].length; i++) {
                if (accessList[msg.sender][i].user == user) {
                    accessList[msg.sender][i].access = true;
                }
            }
        } else {
            accessList[msg.sender].push(Access(user, true));
            previousData[msg.sender][user] = true;
        }
    }

    function disallow(address user) public {
        ownership[msg.sender][user] = false;
        for (uint i = 0; i < accessList[msg.sender].length; i++) {
            if (accessList[msg.sender][i].user == user) {
                accessList[msg.sender][i].access = false;
            }
        }
    }

    // New function to allow access to a specific file
    function allowFile(address user, uint256 fileId) external {
        // Make sure the file exists
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

        fileAccess[msg.sender][fileId][user] = true;

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

    // New function to revoke access to a specific file
    function disallowFile(address user, uint256 fileId) external {
        fileAccess[msg.sender][fileId][user] = false;

        for (uint i = 0; i < fileAccessList[msg.sender][fileId].length; i++) {
            if (fileAccessList[msg.sender][fileId][i].user == user) {
                fileAccessList[msg.sender][fileId][i].access = false;
                break;
            }
        }
    }

    // New function to delete a file
    function deleteFile(uint256 fileId) external {
        bool fileFound = false;

        for (uint i = 0; i < value[msg.sender].length; i++) {
            if (
                value[msg.sender][i].id == fileId && value[msg.sender][i].exists
            ) {
                value[msg.sender][i].exists = false; // Mark as deleted
                fileFound = true;
                break;
            }
        }

        require(fileFound, "File not found or already deleted");

        // Optionally: Remove all access permissions for this file
        // This is commented out as it would increase gas costs
        // But you can uncomment if you want to clean up access permissions

        // Access[] memory accessUsers = fileAccessList[msg.sender][fileId];
        // for (uint i = 0; i < accessUsers.length; i++) {
        //     fileAccess[msg.sender][fileId][accessUsers[i].user] = false;
        // }
    }

    function display(address _user) external view returns (File[] memory) {
        require(
            _user == msg.sender || ownership[_user][msg.sender],
            "You don't have access"
        );

        // Count existing (non-deleted) files
        uint256 existingFileCount = 0;
        for (uint i = 0; i < value[_user].length; i++) {
            if (value[_user][i].exists) {
                existingFileCount++;
            }
        }

        // Create array of existing files
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

    // New function to display specific files shared with you
    function displaySharedFiles(
        address owner
    ) external view returns (File[] memory) {
        File[] memory allFiles = value[owner];
        uint256 sharedFileCount = 0;

        // First, count shared files that haven't been deleted
        for (uint i = 0; i < allFiles.length; i++) {
            if (
                allFiles[i].exists &&
                fileAccess[owner][allFiles[i].id][msg.sender]
            ) {
                sharedFileCount++;
            }
        }

        // Then create and populate the result array
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

    function shareAccess() public view returns (Access[] memory) {
        return accessList[msg.sender];
    }

    // New function to get the access list for a specific file
    function getFileAccessList(
        uint256 fileId
    ) public view returns (Access[] memory) {
        return fileAccessList[msg.sender][fileId];
    }

    // New function to get all files for a user
    function getAllFiles() public view returns (File[] memory) {
        // Count existing (non-deleted) files
        uint256 existingFileCount = 0;
        for (uint i = 0; i < value[msg.sender].length; i++) {
            if (value[msg.sender][i].exists) {
                existingFileCount++;
            }
        }

        // Create array of existing files
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
