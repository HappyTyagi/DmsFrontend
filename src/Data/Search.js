import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  EyeIcon,
  XMarkIcon,
  PrinterIcon,
} from "@heroicons/react/24/solid";

const Search = () => {
  const [searchCriteria, setSearchCriteria] = useState({
    fileNo: '',
    title: '',
    subject: '',
    version: '',
    category: '',
    branch: '',
    department: '',
  });
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState({ paths: [] });
  const [userBranch, setUserBranch] = useState(null);
  const [userDepartment, setUserDepartment] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [noResultsFound, setNoResultsFound] = useState(false);

  useEffect(() => {
    fetchUserDetails();
    fetchCategories();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (searchCriteria.branch) {
      fetchDepartments(searchCriteria.branch);
    } else {
      setDepartmentOptions([]);
    }
  }, [searchCriteria.branch]);

  const fetchUserDetails = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("tokenKey");
      const response = await axios.get(
        `http://localhost:8080/employee/findById/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserRole(response.data.role);
      setUserBranch(response.data.branch);
      setUserDepartment(response.data.department);

      if (response.data.role === 'BRANCH ADMIN' && response.data.branch) {
        setSearchCriteria(prev => ({
          ...prev,
          branch: response.data.branch.id
        }));
        fetchDepartments(response.data.branch.id);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('tokenKey');
      const response = await axios.get(
        'http://localhost:8080/CategoryMaster/findAll',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCategoryOptions(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('tokenKey');
      const response = await axios.get(
        'http://localhost:8080/branchmaster/findAll',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBranchOptions(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchDepartments = async (branchId) => {
    try {
      const token = localStorage.getItem('tokenKey');
      const response = await axios.get(
        `http://localhost:8080/DepartmentMaster/findByBranch/${branchId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDepartmentOptions(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchPaths = async (doc) => {
    try {
      const token = localStorage.getItem('tokenKey');
      const response = await axios.get(
        `http://localhost:8080/api/documents/${doc.id}/paths`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedDoc(prev => ({ ...prev, paths: response.data }));
    } catch (error) {
      console.error('Error fetching document paths:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'branch' && { department: '' }),
    }));
  };

  const handleSearch = async () => {
    try {
      const token = localStorage.getItem('tokenKey');
      let searchPayload = { ...searchCriteria };

      if (userRole === 'BRANCH ADMIN' && userBranch) {
        searchPayload.branch = userBranch.id;
      }

      const response = await axios.post(
        'http://localhost:8080/api/documents/search',
        searchPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSearchResults(response.data);
      setNoResultsFound(response.data.length === 0);
    } catch (error) {
      console.error('Error searching documents:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };
    return date.toLocaleString("en-GB", options).replace(",", "");
  };

  const openModal = (doc) => {
    setSelectedDoc(doc);
    fetchPaths(doc);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedDoc({ paths: [] });
  };

  const printPage = () => {
    window.print();
  };

  const openFile = async (file) => {
    const token = localStorage.getItem("tokenKey");
    const createdOnDate = new Date(file.createdOn);
    const year = createdOnDate.getFullYear();
    const month = String(createdOnDate.getMonth() + 1).padStart(2, "0");
    const category = file.documentHeader.categoryMaster.name;
    const fileName = file.docName;

    const fileUrl = `http://localhost:8080/api/documents/${year}/${month}/${category}/${fileName}`;

    try {
      const response = await axios.get(fileUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("Error fetching file:", error);
    }
  };

  const renderSearchFields = () => {
    return (
      <div className="grid grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          name="fileNo"
          placeholder="File No."
          value={searchCriteria.fileNo}
          onChange={handleInputChange}
          className="p-2 border rounded-md outline-none"
        />
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={searchCriteria.title}
          onChange={handleInputChange}
          className="p-2 border rounded-md outline-none"
        />
        <input
          type="text"
          name="subject"
          placeholder="Subject"
          value={searchCriteria.subject}
          onChange={handleInputChange}
          className="p-2 border rounded-md outline-none"
        />
        <input
          type="text"
          name="version"
          placeholder="Version"
          value={searchCriteria.version}
          onChange={handleInputChange}
          className="p-2 border rounded-md outline-none"
        />
        <select
          name="category"
          value={searchCriteria.category}
          onChange={handleInputChange}
          className="p-2 border rounded-md outline-none"
        >
          <option value="">Select Category</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {userRole === 'ADMIN' ? (
          <>
            <select
              name="branch"
              value={searchCriteria.branch}
              onChange={handleInputChange}
              className="p-2 border rounded-md outline-none"
            >
              <option value="">Select Branch</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <select
              name="department"
              value={searchCriteria.department}
              onChange={handleInputChange}
              className="p-2 border rounded-md outline-none"
              disabled={!searchCriteria.branch}
            >
              <option value="">Select Department</option>
              {departmentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </>
        ) : userRole === 'BRANCH ADMIN' ? (
          <>
            <select
              name="branch"
              value={searchCriteria.branch}
              onChange={handleInputChange}
              className="p-2 border rounded-md outline-none"
              disabled
            >
              <option value={userBranch?.id}>{userBranch?.name}</option>
            </select>
            <select
              name="department"
              value={searchCriteria.department}
              onChange={handleInputChange}
              className="p-2 border rounded-md outline-none"
            >
              <option value="">Select Department</option>
              {departmentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <select
              name="branch"
              value={userBranch?.id || ''}
              disabled
              className="p-2 border rounded-md outline-none bg-gray-100"
            >
              <option value={userBranch?.id}>{userBranch?.name}</option>
            </select>
            <select
              name="department"
              value={userDepartment?.id || ''}
              disabled
              className="p-2 border rounded-md outline-none bg-gray-100"
            >
              <option value={userDepartment?.id}>{userDepartment?.name}</option>
            </select>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-blue-100 p-4 rounded-lg shadow-sm mb-4">
      <h2 className="text-lg font-semibold mb-3">Search Documents</h2>
      {renderSearchFields()}
      <button
        onClick={handleSearch}
        className="bg-rose-900 text-white rounded-md py-2 px-4 hover:bg-rose-800 transition duration-300"
      >
        Search
      </button>

      {/* Search Results Table */}
      {noResultsFound ? (
        <div className="mt-4 text-red-600">
          <h3>No results found for your search.</h3>
        </div>
      ) : (
        searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-3">Search Results</h3>
            <table className="min-w-full table-auto bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border p-2 text-left">File No</th>
                  <th className="border p-2 text-left">Title</th>
                  <th className="border p-2 text-left">Subject</th>
                  <th className="border p-2 text-left">Version</th>
                  <th className="border p-2 text-left">Category</th>
                  <th className="border p-2 text-left">Approval Status</th>
                  <th className="border p-2 text-left">Uploaded Date</th>
                  <th className="border p-2 text-left">View</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((document) => (
                  <tr key={document.id}>
                    <td className="border p-2">{document.fileNo}</td>
                    <td className="border p-2">{document.title}</td>
                    <td className="border p-2">{document.subject}</td>
                    <td className="border p-2">{document.version}</td>
                    <td className="border p-2">
                      {document.categoryMaster?.name || "No Category"}
                    </td>
                    <td className="border p-2">{document.approvalStatus}</td>
                    <td className="border p-2">{formatDate(document.createdOn)}</td>
                    <td className="border p-2">
                      <button onClick={() => openModal(document)}>
                        <EyeIcon className="h-6 w-6 bg-green-400 rounded-xl p-1 text-white" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Document View Modal */}
      {isOpen && selectedDoc && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
          <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
            <button
              className="absolute top-2 right-10 text-gray-500 hover:text-gray-700 no-print"
              onClick={printPage}
            >
              <PrinterIcon className="h-6 w-6" />
            </button>

            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 no-print"
              onClick={closeModal}
            >
              <XMarkIcon className="h-6 w-6 text-black hover:text-white hover:bg-red-800" />
            </button>

            <div className="h-1/2 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4 mt-4">
                <div className="flex items-start space-x-1">
                  <p className="text-sm text-black font-bold border-b-4 border-black">
                    D
                  </p>
                  <p className="text-sm text-black font-bold border-t-4 border-black">
                    MS
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    <strong>Uploaded Date:</strong>{" "}
                    {formatDate(selectedDoc?.createdOn)}
                  </p>
                </div>
              </div>

            

              <div className="text-left">
                <p className="text-sm text-gray-600">
                  <strong>File No.:</strong> {selectedDoc?.fileNo || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Title:</strong> {selectedDoc?.title || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Subject:</strong> {selectedDoc?.subject || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Version:</strong> {selectedDoc?.version || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Category:</strong> {selectedDoc?.categoryMaster?.name || "No Category"}
                </p>
              </div>
            </div>

            <div className="h-1/2 flex flex-col items-center justify-center mt-4">
              <h1 className="text-sm text-center font-bold mb-2">Attached Files</h1>

              {Array.isArray(selectedDoc.paths) && selectedDoc.paths.length > 0 ? (
                <ul className="list-disc list-inside">
                  {selectedDoc.paths.map((file, index) => (
                    <li key={index} className="mb-2">
                      <span className="mr-4">{file.docName}</span>
                      <button
                        onClick={() => openFile(file)}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Open
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No attached files available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;