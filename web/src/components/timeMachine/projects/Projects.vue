<template>
  <v-container grid-list-xl fluid class="custom-manage-projects-container">
    <v-layout>
      <v-flex md12>
        <h1 class="projects-header">Projects</h1>
      </v-flex>
    </v-layout>
    <v-layout row wrap>
      <v-flex xs12>
        <projects-table></projects-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import Material from 'vuetify/es5/util/colors';
import ProjectsTable from './ProjectsTable.vue';

import './projects.styl';

export default {
  components: {
    ProjectsTable,
  },
  data: () => ({
    color: Material,
    selectedTab: 'tab-1',
  }),
  computed: {},
};
</script>

<style></style>
