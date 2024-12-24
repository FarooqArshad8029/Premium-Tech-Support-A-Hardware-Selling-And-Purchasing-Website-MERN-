import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  clearError,
  clearMessage,
} from "../../../redux/reducers/profileReducer";
import {
  changePassword,
  updateUserProfile,
} from "../../../redux/actions/profileAction";
import UserChangePassword from "../../common/UserChangePassword";

function EditProfile() {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });

  const { user } = useSelector((state) => state.auth);
  const { loading, error, message } = useSelector((state) => state.profile);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setFormData({
      username: user?.username,
      email: user?.email,
    });
  }, [user]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile(formData));
  };

  useEffect(() => {
    if (error) {
      toast.error(error.message);
      dispatch(clearError());
    }
    if (message) {
      toast.success(message);
      dispatch(clearMessage());
    }
  }, [error, message, dispatch, toast]);
  return (
    <>
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded px-10 py-10 mt-10">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className="block text-gray-700 font-bold mb-2"
                htmlFor="oldPassword"
              >
                Username
              </label>
              <input
                className="border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                name="username"
                placeholder="Enter the Username"
                value={formData.username}
                onChange={handleChange}
                required
                readOnly={!editMode}
              />
            </div>
            <div>
              <label
                className="block text-gray-700 font-bold mb-2"
                htmlFor="newPassword"
              >
                Email
              </label>
              <input
                className="border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="email"
                name="email"
                placeholder="Enter the Email"
                value={formData.email}
                onChange={handleChange}
                required
                readOnly={!editMode}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                editMode ? "hidden" : ""
              }`}
            >
              Edit
            </button>
            <button
              disabled={loading}
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                !editMode ? "hidden" : ""
              }`}
            >
              {loading ? "Loading...." : "Update"}
            </button>
          </div>
        </form>
      </div>
      <UserChangePassword />
    </>
  );
}

export default EditProfile;
