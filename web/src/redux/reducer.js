import * as actionTypes from "./actionTypes";

export const initialState = {
  currentUser: null,
  userEntries: [],
  isLoadingCurrentUser: false,
  isLoadingSignIn: false,
  isLoadingNewEntry: false,
  isLoadingUserEntries: false,
  checkedAuthState: false,
  isDeletingCurrentEntry: false,
  isUpdatingUser: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.CHECK_CURRENT_USER:
      return { ...state, isLoadingCurrentUser: true };

    case actionTypes.CURRENT_USER_VALID:
      return {
        ...state,
        isLoadingCurrentUser: false,
        currentUser: action.user,
        checkedAuthState: true
      };

    case actionTypes.CURRENT_USER_VOID:
      return {
        ...state,
        isLoadingCurrentUser: false,
        currentUser: null,
        checkedAuthState: true
      };

    case actionTypes.SIGN_IN_USER_FETCH:
      return { ...state, isLoadingSignIn: true };

    case actionTypes.SIGN_IN_USER_SUCCESS:
      return { ...state, isLoadingSignIn: false, currentUser: action.user };

    case actionTypes.SIGN_IN_USER_FAIL:
      return {
        ...state,
        isLoadingSignIn: false,
        currentUser: null,
        error: action.error
      };

    case actionTypes.POST_ENTRY:
      return { ...state, isLoadingNewEntry: true };

    case actionTypes.POST_ENTRY_SUCCESS:
      return {
        ...state,
        isLoadingNewEntry: false,
        currentUser: { ...state.currentUser, currentEntry: action.entry }
      };

    case actionTypes.POST_ENTRY_FAIL:
      return { ...state, isLoadingNewEntry: false, error: action.error };

    case actionTypes.GET_USER_ENTRIES:
      return { ...state, isLoadingUserEntries: true };

    case actionTypes.GET_USER_ENTRIES_SUCCESS:
      return {
        ...state,
        isLoadingUserEntries: false,
        userEntries: action.entries
      };

    case actionTypes.GET_USER_ENTRIES_FAIL:
      return {
        ...state,
        isLoadingUserEntries: false,
        error: action.error,
        userEntries: []
      };

    case actionTypes.DELETE_CURRENT_ENTRY:
      return {
        ...state,
        isDeletingCurrentEntry: true
      };

    case actionTypes.DELETE_CURRENT_ENTRY_SUCCESS:
      return {
        ...state,
        isDeletingCurrentEntry: false,
        currentUser: {
          ...state.currentUser,
          currentEntry: null
        }
      };

    case actionTypes.DELETE_CURRENT_ENTRY_FAIL:
      return {
        ...state,
        isDeletingCurrentEntry: false,
        error: action.error
      };

    case actionTypes.UPDATE_USER:
      return {
        ...state,
        isUpdatingUser: true
      };

    case actionTypes.UPDATE_USER_SUCCESS:
      return {
        ...state,
        currentUser: action.user,
        isUpdatingUser: false
      };

    case actionTypes.UPDATE_USER_FAIL:
      return {
        ...state,
        isUpdatingUser: false,
        error: action.error
      };

    default:
      return state;
  }
};

export default reducer;
