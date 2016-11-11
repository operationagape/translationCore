const React = require('react');
const bootstrap = require('react-bootstrap');

const NavMenu = require('./../components/core/navigation_menu/NavigationMenu.js');
const SideBarContainer = require('../components/core/SideBar/SideBarContainer');
const StatusBar = require('../components/core/SideBar/StatusBar');
const LoginModal = require('../components/core/login/LoginModal');
const SwitchCheckModal = require('../components/core/SwitchCheckModal');
const SettingsModal = require('../components/core/SettingsModal.js');
const ProjectModal = require('../components/core/create_project/ProjectModal');
const Loader = require('../components/core/Loader');
const RootStyles = require('./RootStyle');
const Grid = require('react-bootstrap/lib/Grid.js');
const Row = require('react-bootstrap/lib/Row.js');
const Col = require('react-bootstrap/lib/Col.js');
const ModuleProgress = require('../components/core/ModuleProgress/ModuleProgressBar')
const Toast = require('../NotificationApi/ToastComponent');
const CheckDataGrabber = require('../components/core/create_project/CheckDataGrabber.js');

const Welcome = require('../components/core/welcome/welcome');
const AlertModal = require('../components/core/AlertModal');
const Access = require('../components/core/AccessProject.js');
const api = window.ModuleApi;
const CheckStore = require('../stores/CheckStore.js');
const ModuleWrapper = require('../components/core/ModuleWrapper');
const CoreActions = require('../actions/CoreActions.js');
const Popover = require('../components/core/Popover');
const Upload = require('../components/core/Upload');

var Main = React.createClass({
  getInitialState() {
    var tutorialState = api.getSettings('showTutorial');
    if (tutorialState == 'true' || tutorialState === null) {
      return ({
        firstTime: true
      })
    } else {
      return ({
        firstTime: false
      })
    }
  },

  componentDidMount: function () {
    if (localStorage.getItem('crashed') == 'true')
    {
      localStorage.removeItem('lastProject');
      api.setSettings('showTutorial', false);
    } 
    var saveLocation = localStorage.getItem('lastProject');
    if (api.getSettings('showTutorial') !== true && saveLocation) {
      this.refs.TargetLanguage.sendFilePath(saveLocation, null, () => {
        var lastCheckModule = localStorage.getItem('lastCheckModule');
        if (lastCheckModule) {
            CheckDataGrabber.loadModuleAndDependencies(lastCheckModule);
        }
      });
    }

  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.showCheck == true) {
      CoreActions.showCreateProject("Languages");
      this.showCheck = false;
    }
  },

  finishWelcome: function () {
    this.setState({
      firstTime: false
    });
    this.showCheck = true;
  },

  render: function () {
    var _this = this;
    if (this.state.firstTime) {
      return (
        <Welcome initialize={this.finishWelcome} />
      )
    } else {
      return (
        <div className='fill-height'>
          <SettingsModal />
          <Upload ref={"TargetLanguage"} show={false} />
          <LoginModal />
          <ProjectModal />
          <SideBarContainer />
          <StatusBar />
          <SwitchCheckModal.Modal />
          <Popover />
          <Toast />
          <Grid fluid className='fill-height' style={{ marginLeft: '100px', paddingTop: "30px"}}>
            <Row className='fill-height main-view'>
              <Col className='fill-height' xs={5} sm={4} md={3} lg={2} style={{ padding: "0px", backgroundColor: "#747474" }}>
               <NavMenu />
              </Col>
              <Col style={RootStyles.ScrollableSection} xs={7} sm={8} md={9} lg={10}>
                <Loader />
                <AlertModal />
                <ModuleWrapper />
                <ModuleProgress />
              </Col>
            </Row>
          </Grid>
        </div>
      )
    }
  }
});

module.exports = (
  <Main />
);
