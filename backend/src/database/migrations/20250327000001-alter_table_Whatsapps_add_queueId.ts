import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Whatsapps", "queueId", {
      type: DataTypes.INTEGER,
      references: { model: "Queues", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true,
      defaultValue: null
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Whatsapps", "queueId");
  }
};
