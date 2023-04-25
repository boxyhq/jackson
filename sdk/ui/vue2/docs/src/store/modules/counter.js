const state = {
  count: 0,
};

const mutations = {
  increment(state) {
    state.count++;
  },
};

const actions = {
  increment({ commit }) {
    commit('increment');
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
