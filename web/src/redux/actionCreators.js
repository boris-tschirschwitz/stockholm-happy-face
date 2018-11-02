import axios from "axios";
import ButterToast from "butter-toast";
import moment from "moment";

import { signIn } from "../auth";
import User from "../models/user";
import Entry from "../models/entry";
import * as actionTypes from "./actionTypes";

const RESOURCES = {
  users: "http://localhost:3000/api/v1/users",
  userByEmail: "http://localhost:3000/api/v1/users/email",
  entries: "http://localhost:3000/api/v1/entries"
};

export const signInUser = () => {
  return async dispatch => {
    dispatch(fetchSignInUser());

    let tmpUserObj;
    try {
      tmpUserObj = await signIn();
    } catch (error) {
      ButterToast.raise({
        content: "Signing in failed, try again!"
      });
      return dispatch(signInUserFail(error.message));
    }
    let response;
    try {
      response = await axios.get(RESOURCES.userByEmail, {
        params: { email: tmpUserObj.email }
      });
    } catch (error) {
      if (!error.entry) {
        ButterToast.raise({ content: "Couldn't reach the server..." });
        return dispatch(signInUserFail(error.message));
      }
      if (error.entry.status === 404) {
        ButterToast.raise({
          content: `Creating new user: ${tmpUserObj.email}`
        });
        try {
          response = await axios.post(RESOURCES.users, {
            name: tmpUserObj.name,
            email: tmpUserObj.email,
            avatar: tmpUserObj.avatar
          });
        } catch (error) {
          if (error.entry.status === 400) {
            ButterToast.raise({
              content: "Creating new user failed, try another email!"
            });
          } else {
            ButterToast.raise({ content: "Creating new user failed" });
          }
          return dispatch(signInUserFail(error.message));
        }
      } else {
        ButterToast.raise({ content: "Sign in failed, try again!" });
        return dispatch(signInUserFail(error.message));
      }
    }

    const { id, name, nickname, email, avatar } = response.data.user;
    const userObj = new User(name, email, avatar, nickname);
    userObj.id = id;

    return dispatch(signInUserSuccess(userObj));
  };
};

export const fetchSignInUser = () => {
  return { type: actionTypes.SIGN_IN_USER_FETCH };
};

export const signInUserSuccess = userObj => {
  return { type: actionTypes.SIGN_IN_USER_SUCCESS, user: userObj };
};

export const signInUserFail = error => ({
  type: actionTypes.SIGN_IN_USER_FAIL,
  error
});

export const saveEntry = content => {
  return async (dispatch, getState) => {
    dispatch(postEntry());

    const currentUser = getState().currentUser;
    let response;
    try {
      response = await axios.post(RESOURCES.entries, {
        userId: currentUser.id,
        [content.includes("http") ? "link" : "text"]: content
      });
    } catch (error) {
      return dispatch(postEntryError(error.message));
    }

    const resData = response.data.entry;
    const entryObj = new Entry(
      resData.user,
      resData.text,
      resData.link,
      moment(resData.createdAt),
      resData.week,
      resData.id
    );

    ButterToast.raise({
      content: `New entry saved for week ${entryObj.week}`
    });
    dispatch(postEntrySuccess(entryObj));
  };
};

export const postEntry = () => ({ type: actionTypes.POST_ENTRY });

export const postEntrySuccess = entry => ({
  type: actionTypes.POST_ENTRY_SUCCESS,
  entry
});

export const postEntryError = error => ({
  type: actionTypes.POST_ENTRY_FAIL,
  error
});

export const getUserEntries = () => {
  return async (dispatch, getState) => {
    dispatch(fetchUserEntries());

    let axiosResponse;
    try {
      axiosResponse = await axios.get(RESOURCES.entries, {
        params: { userName: getState().currentUser.name }
      });
    } catch (error) {
      return dispatch(fetchUserEntriesError(error.message));
    }

    const entries = axiosResponse.data.entries.map(
      data =>
        new Entry(
          data.user,
          data.text,
          data.link,
          moment(data.createdAt),
          data.week
        )
    );
    dispatch(fetchUserEntriesSuccess(entries));
  };
};

export const fetchUserEntries = () => ({
  type: actionTypes.GET_USER_ENTRIES
});

export const fetchUserEntriesSuccess = entries => ({
  type: actionTypes.GET_USER_ENTRIES_SUCCESS,
  entries
});

export const fetchUserEntriesError = error => ({
  type: actionTypes.GET_USER_ENTRIES_FAIL,
  error
});

export const checkCurrentUser = userObj => {
  return async dispatch => {
    dispatch(findCurrentUser());
    let response;
    try {
      response = await axios.get(RESOURCES.userByEmail, {
        params: { email: userObj.email }
      });
    } catch (error) {
      return dispatch(invalidCurrentUser());
    }

    userObj.id = response.data.user.id;
    userObj.nickname = response.data.user.nickname;

    const currentEntry = response.data.user.currentEntry;
    if (currentEntry) {
      userObj.currentEntry = new Entry(
        userObj,
        currentEntry.text,
        currentEntry.link,
        moment(currentEntry.createdAt),
        currentEntry.week,
        currentEntry.id
      );
    }
    ButterToast.raise({
      content: `Found signed in user: ${userObj.name}`
    });
    dispatch(foundValidCurrentUser(userObj));
  };
};

export const findCurrentUser = () => ({
  type: actionTypes.CHECK_CURRENT_USER
});

export const foundValidCurrentUser = userObj => ({
  type: actionTypes.CURRENT_USER_VALID,
  user: userObj
});

export const invalidCurrentUser = () => ({
  type: actionTypes.CURRENT_USER_VOID
});

export const deleteCurrentEntry = () => {
  return async (dispatch, getState) => {
    dispatch(requestDeleteCurrentEntry());

    let response;
    try {
      const entryId = getState().currentUser.currentEntry.id;
      response = await axios.delete(`${RESOURCES.entries}/${entryId}`);
    } catch (error) {
      return dispatch(failDeleteCurrentEntry(error.message));
    }

    ButterToast.raise({
      content: `${response.data.entry.id}: deleted`
    });
    return dispatch(succeedDeleteCurrentEntry());
  };
};

export const requestDeleteCurrentEntry = () => ({
  type: actionTypes.DELETE_CURRENT_ENTRY
});

export const succeedDeleteCurrentEntry = () => ({
  type: actionTypes.DELETE_CURRENT_ENTRY_SUCCESS
});

export const failDeleteCurrentEntry = error => ({
  type: actionTypes.DELETE_CURRENT_ENTRY_FAIL,
  error
});

export const updateCurrentUser = ({ nickname }) => {
  return async (dispatch, getState) => {
    dispatch(updateUser());

    const currentUser = getState().currentUser;
    let response;
    try {
      response = await axios.put(`${RESOURCES.users}/${currentUser.id}`, {
        nickname
      });
    } catch (error) {
      ButterToast.raise({ content: `Unable to save user... 🤔` });
      return dispatch(updateUserFail(error.message));
    }

    const {
      id,
      name,
      nickname: newNickname,
      email,
      avatar
    } = response.data.user;
    const userObj = new User(name, email, avatar, newNickname);
    userObj.id = id;

    if (nickname === "RANDOM") {
      ButterToast.raise({ content: `Your new nickname is ${newNickname}!` });
    } else {
      ButterToast.raise({ content: `User updated!` });
    }
    dispatch(updateUserSuccess(userObj));
  };
};

export const updateUser = () => ({
  type: actionTypes.UPDATE_USER
});

export const updateUserSuccess = userObj => ({
  type: actionTypes.UPDATE_USER_SUCCESS,
  user: userObj
});

export const updateUserFail = error => ({
  type: actionTypes.UPDATE_USER_FAIL,
  error
});
