"use strict";

const { User, Grup, Menu, Submenu, Tab } = require("../../../models");
const bcrypt = require("bcryptjs");

class Model_r {
  constructor(req) {
    this.req = req;
  }

  async info_user() {
    try {
      var q = await User.findOne({
        where: {
          id: this.req.user.id,
        },
      });
      return {
        id: q.id,
        username: q.username,
        name: q.name,
        password: q.password,
      };
    } catch (error) {
      return {};
    }
  }

  async get_info_edit_profile() {
    try {
      var q = await User.findOne({
        where: {
          id: this.req.user.id,
        },
      });
      return {
        id: q.id,
        username: q.username,
        name: q.name,
        jabatan: q.jabatan,
      };
    } catch (error) {
      return {};
    }
  }

  async getInfoUser() {
    try {
      var q = await User.findOne({
        where: { username: this.req.body.username },
      });
      if (!q) return null;
      const validPassword = await bcrypt.compare(
        this.req.body.password,
        q.password
      );
      if (!validPassword) return null;
      return {
        id: q.id,
        username: q.username,
        name: q.name,
        jabatan: q.jabatan,
      };
    } catch (error) {
      return null;
    }
  }

  async get_menu_submenu_tab() {
    try {
      var user_info = {};
      await User.findOne({
        where: {
          id: this.req.user.id,
        },
        include: [
          {
            required: true,
            model: Grup,
          },
        ],
      }).then(async (e) => {
        if (e) {
          user_info["name"] = e.name;
          user_info["grup_id"] = e.grup_id;
          user_info["grup"] = e.Grup.name;
          if (e.grup_id == 1) {
            user_info["group_access"] = {};
          } else {
            try {
              user_info["group_access"] = JSON.parse(e.Grup.group_access);
            } catch {
              user_info["group_access"] = [];
            }
          }
        }
      });

      var list_tab_user = { menu: [], submenu: [] };
      for (let x in user_info.group_access) {
        list_tab_user.menu.push(user_info.group_access[x].id);
        if (user_info.group_access[x].Submenus.length > 0) {
          for (let y in user_info.group_access[x].Submenus) {
            list_tab_user.submenu.push(
              user_info.group_access[x].Submenus[y].id
            );
          }
        }
      }

      var menu = {};
      await Menu.findAll().then(async (value) => {
        await Promise.all(
          await value.map(async (e) => {
            if (user_info["grup_id"] != 1) {
              if (list_tab_user.menu.includes(e.id)) {
                menu[e.id] = {
                  id: e.id,
                  name: e.name,
                  path: e.path,
                  icon: e.icon,
                  tab: e.path === "#" ? "" : JSON.parse(e.tab),
                };
              }
            } else {
              menu[e.id] = {
                id: e.id,
                name: e.name,
                path: e.path,
                icon: e.icon,
                tab: e.path === "#" ? "" : JSON.parse(e.tab),
              };
            }
          })
        );
      });

      var submenu = {};
      await Submenu.findAll().then(async (value) => {
        await Promise.all(
          await value.map(async (e) => {
            if (submenu[e.menu_id] === undefined) {
              if (user_info["grup_id"] === 1) {
                submenu = {
                  ...submenu,
                  ...{
                    [e.menu_id]: [
                      {
                        id: e.id,
                        name: e.name,
                        path: e.path,
                        tab: e.tab === "" ? "" : JSON.parse(e.tab),
                      },
                    ],
                  },
                };
              } else {
                if (list_tab_user.submenu.includes(e.id)) {
                  submenu = {
                    ...submenu,
                    ...{
                      [e.menu_id]: [
                        {
                          id: e.id,
                          name: e.name,
                          path: e.path,
                          tab: e.tab === "" ? "" : JSON.parse(e.tab),
                        },
                      ],
                    },
                  };
                }
              }
            } else {
              if (user_info["grup_id"] === 1) {
                submenu[e.menu_id].push({
                  id: e.id,
                  name: e.name,
                  path: e.path,
                  tab: e.tab === "" ? "" : JSON.parse(e.tab),
                });
              } else {
                if (list_tab_user.submenu.includes(e.id)) {
                  submenu[e.menu_id].push({
                    id: e.id,
                    name: e.name,
                    path: e.path,
                    tab: e.tab === "" ? "" : JSON.parse(e.tab),
                  });
                }
              }
            }
          })
        );
      });

      var tab = {};
      await Tab.findAll().then(async (value) => {
        await Promise.all(
          await value.map(async (e) => {
            tab = {
              ...tab,
              ...{
                [e.id]: {
                  id: e.id,
                  name: e.name,
                  icon: e.icon,
                  path: e.path,
                  title: e.title,
                  desc: e.desc,
                },
              },
            };
          })
        );
      });

      return { menu_info: { menu, submenu, tab }, user_info: user_info };
    } catch (error) {
      return {};
    }
  }
}

module.exports = Model_r;
