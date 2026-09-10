/* BioPlot Project Persistence Layer
   Phase 1: local project storage
*/

window.BioPlotStorage = {
  key: 'bioplot_projects_v1',

  getProjects(){
    try{
      return JSON.parse(localStorage.getItem(this.key)) || [];
    }catch(e){
      return [];
    }
  },

  saveProject(project){
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);

    project.updated = new Date().toISOString();

    if(index >= 0) projects[index] = project;
    else projects.unshift(project);

    localStorage.setItem(this.key, JSON.stringify(projects));
    return project;
  },

  loadProject(id){
    return this.getProjects().find(p => p.id === id) || null;
  },

  deleteProject(id){
    const projects = this.getProjects().filter(p => p.id !== id);
    localStorage.setItem(this.key, JSON.stringify(projects));
  }
};
