//MenuView.js//

//Api consts
const api = window.ModuleApi;
const React = api.React;
const ReactBootstrap = api.ReactBootstrap;

//bootstrap imports
const Well = ReactBootstrap.Well;

//dev imports
const MenuItem = require('./MenuItem.js');

//other consts
const extensionRegex = new RegExp('\\.\\w+\\s*$');

module.exports = function(NAMESPACE) {

  class MenuView extends React.Component {
    constructor() {
      super();
      var checkData = api.getDataFromCheckStore(NAMESPACE);
      this.state = {
        checkObject: checkData,
        currentGroup: ""
      };

      this.currentGroupIndex = checkData.currentGroupIndex;
      this.currentCheckIndex = checkData.currentCheckIndex;
      this.updateMenuItem = this.updateMenuItem.bind(this);
      this.goToCheck = this.goToCheck.bind(this);
      this.goToNext = this.goToNext.bind(this);
      this.goToPrevious = this.goToPrevious.bind(this);
    }

    componentWillMount() {
      api.registerEventListener('changedCheckStatus', this.updateMenuItem);
      api.registerEventListener('goToCheck', this.goToCheck);
      api.registerEventListener('goToNext', this.goToNext);
      api.registerEventListener('goToPrevious', this.goToPrevious);
      api.registerEventListener('groupChanged', this.changeGroup);
      this.setState({
        checkObject: api.getDataFromCheckStore(NAMESPACE)
      });
    }

    componentWillUnmount() {
      api.removeEventListener('changedCheckStatus', this.updateMenuItem);
      api.removeEventListener('goToCheck', this.goToCheck);
      api.removeEventListener('goToNext', this.goToNext);
      api.removeEventListener('goToPrevious', this.goToPrevious);
    }

    componentDidMount() {
      if(this.refs[`${this.currentGroupIndex} ${this.currentCheckIndex}`]){
        this.refs[`${this.currentGroupIndex} ${this.currentCheckIndex}`].setIsCurrentCheck(true);
      }
    }

    updateMenuItem(params) {
      var menuItem = this.refs[params.groupIndex.toString() + ' ' + params.checkIndex.toString()];
      menuItem.changeCheckStatus(params.checkStatus);
    }

    goToNext() {
      this.unselectOldMenuItem();
      // if we need to move to the next group
      if (this.currentCheckIndex >= this.state.checkObject.groups[this.currentGroupIndex].checks.length - 1) {
        // if we're not on the last group
        if (this.currentGroupIndex < this.state.checkObject.groups.length - 1) {
          this.currentGroupIndex++;
          this.currentCheckIndex = 0;
        }
      }
      else { // if we still have more in the group
        this.currentCheckIndex++;
      }
      this.selectNewMenuItem();
    }

    goToPrevious() {
      this.unselectOldMenuItem();
      // if we need to move to the previous group
      if (this.currentCheckIndex <= 0) {
        // if we're not on the first group
        if (this.currentGroupIndex > 0) {
          this.currentGroupIndex--;
          this.currentCheckIndex = this.state.checkObject.groups[this.currentGroupIndex].checks.length - 1;
        }
      }
      else { // if we still have more in the group
        this.currentCheckIndex--;
      }
      this.selectNewMenuItem();
    }

    goToCheck(params) {
      this.unselectOldMenuItem();
      this.currentGroupIndex = params.groupIndex;
      this.currentCheckIndex = params.checkIndex;
      this.selectNewMenuItem();
    }

    unselectOldMenuItem() {
      this.refs[`${this.currentGroupIndex} ${this.currentCheckIndex}`].setIsCurrentCheck(false);
    }

    selectNewMenuItem() {
      this.refs[`${this.currentGroupIndex} ${this.currentCheckIndex}`].setIsCurrentCheck(true);
    }

    render() {
      var _this = this;
      var menuList;
      if (this.state.checkObject['groups']) {
        menuList = this.state.checkObject["groups"].map(function(group, groupIndex) {
          var groupHeader = (
            <div>{group.group}</div>
          );
          var checkMenuItems = group.checks.map(function(check, checkIndex) {
            console.log(group);
            return (
              <div key={checkIndex}>
                <MenuItem
                  book={_this.state.checkObject.book}
                  check={check}
                  groupIndex={groupIndex}
                  checkIndex={checkIndex}
                  ref={groupIndex.toString() + ' ' + checkIndex.toString()} />
              </div>
            );
          });
          return (
            <div key={groupIndex} style={{paddingBottom: '15px'}}>
              {groupHeader}
              {checkMenuItems}
            </div>
          );
        });
        return (
        <div className='fill-height'>
          <Well className='fill-height' style={{overflowY: 'scroll'}}>
            <div>
              {menuList}
            </div>
          </Well>
        </div>
      )
    } else {
      return (
        <div>
        </div>
      )
    }
    }
  }


  /**
  * Compares two string alphabetically
  * @param {string} first - string to be compared against
  * @param {string} second - string to be compared with
  */
  function stringCompare(first, second) {
    if (first < second) {
      return -1;
    }
    else if (first > second) {
      return 1;
    }
  else {
      return 0;
    }
  }

  /**
  * @description - Binary search of the list. I couldn't find this in the native methods of an array so
  * I wrote it
  * @param {array} list - array of items to be searched
  * @param {function} boolFunction - returns # < 0, # > 0. or 0 depending on which path the
  * search should take
  * @param {int} first - beginnging of the current partition of the list
  * @param {int} second - end of the current partition of the list
  */
  function search(list, boolFunction, first = 0, last = -1) {
    if (last == -1) {
      last = list.length;
    }
    if (first > last) {
      return;
    }
    var mid = Math.floor(((first - last) * 0.5)) + last;
    var result = boolFunction(list[mid]);
    if (result < 0) {
      return search(list, boolFunction, first, mid - 1);
    }
    else if (result > 0) {
      return search(list, boolFunction, mid + 1, last);
    }
  else {
      return list[mid];
    }
  }

  return MenuView;

};
