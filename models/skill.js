"use strict";

module.exports = function(sequelize, DataTypes) {
  var Skill = sequelize.define("Skill", {
    name: { // name of the skill
      type: DataTypes.STRING,
    },
    proficiency: { // the level of proficiency in the skill on a scale of 0-100
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 100
      }
    },
    start_date: { // how long the skill has been practiced for
      type: DataTypes.DATE
    },
  }, {
    classMethods: {
      associate: function(models) {


        
      },
    }
  });

  return Skill;
};
