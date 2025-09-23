import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addIndex("Messages", ["messageId", "tenantId"], {
      name: "idx_messages_messageid_tenantid"
    });

    await queryInterface.addIndex("Messages", ["ticketId"], {
      name: "idx_messages_ticketid"
    });

  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex(
      "Messages",
      "idx_messages_ticketid"
    );

  }
};
