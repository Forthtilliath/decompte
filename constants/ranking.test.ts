import { formatRank } from "@/constants/ranking";

describe("formatRank", () => {
	it("écrit « 1er » pour la première place, « Ne » ensuite", () => {
		expect(formatRank(1)).toBe("1er");
		expect(formatRank(2)).toBe("2e");
		expect(formatRank(11)).toBe("11e");
	});
});
