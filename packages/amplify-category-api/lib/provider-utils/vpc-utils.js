"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailabilityZoneOfSubnets = void 0;
const client_ec2_1 = require("@aws-sdk/client-ec2");
const getAvailabilityZoneOfSubnets = async (subnetIds, region) => {
    var _a;
    const ec2 = new client_ec2_1.EC2Client({ region });
    const command = new client_ec2_1.DescribeSubnetsCommand({
        SubnetIds: subnetIds,
    });
    const subnets = await ec2.send(command);
    return (_a = subnets.Subnets) === null || _a === void 0 ? void 0 : _a.map((subnet) => ({
        subnetId: subnet.SubnetId,
        availabilityZone: subnet.AvailabilityZone,
    }));
};
exports.getAvailabilityZoneOfSubnets = getAvailabilityZoneOfSubnets;
//# sourceMappingURL=vpc-utils.js.map