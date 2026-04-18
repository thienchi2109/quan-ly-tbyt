import { openRepairRequestSheet } from "../repair-request-print"

import type { RepairRequestWithEquipment } from "../../types"

describe("openRepairRequestSheet", () => {
  const request: RepairRequestWithEquipment = {
    id: 1,
    thiet_bi_id: 10,
    ngay_yeu_cau: "2026-04-18T00:00:00.000Z",
    trang_thai: "moi_tao",
    mo_ta_su_co:
      "Tế bào đo máu (điện cực) máy miễn dịch e411 của phòng Xét nghiệm Sinh hóa - miễn dịch thuộc Khoa Xét nghiệm cần mô tả dài để kiểm tra việc không bị cắt mất nội dung khi in phiếu.",
    hang_muc_sua_chua:
      "Kiểm tra, vệ sinh, thay thế vật tư hao mòn nếu cần và hiệu chuẩn lại thiết bị sau sửa chữa.",
    ngay_mong_muon_hoan_thanh: "2026-04-25",
    nguoi_yeu_cau: "Nguyễn Văn A",
    ngay_duyet: null,
    ngay_hoan_thanh: null,
    nguoi_duyet: null,
    nguoi_xac_nhan: null,
    don_vi_thuc_hien: "thue_ngoai",
    ten_don_vi_thue: "Công ty ABC",
    ket_qua_sua_chua: null,
    ly_do_khong_hoan_thanh: null,
    thiet_bi: {
      ten_thiet_bi:
        "Máy miễn dịch e411 với tên đầy đủ đủ dài để kiểm tra trường nhập không còn bị truncate khi hiển thị trên phiếu in",
      ma_thiet_bi: "TB-001",
      model: "e411",
      serial: "SN-001",
      khoa_phong_quan_ly:
        "Phòng Xét nghiệm Sinh hóa - miễn dịch thuộc Khoa Xét nghiệm",
    },
  }

  it("renders expandable text fields so long values are not truncated in the print sheet", () => {
    const writeDocument = jest.fn()
    const mockOpen = jest.spyOn(window, "open").mockReturnValue({
      document: {
        open: jest.fn(),
        write: writeDocument,
        close: jest.fn(),
      },
    } as unknown as Window)

    const result = openRepairRequestSheet(request)
    const html = writeDocument.mock.calls[0][0] as string

    expect(result).toBe(true)
    expect(html).toContain("overflow: hidden;")
    expect(html).toContain('textarea id="department-request"')
    expect(html).toContain('textarea id="device-name"')
    expect(html).toContain('textarea id="damage-description"')
    expect(html).toContain('textarea id="repair-request"')
    expect(html).toContain('textarea id="tbyt-opinion"')
    expect(html).toContain('class="form-textarea mt-1 auto-expand-field"')
    expect(html).toContain("document.querySelectorAll(\".auto-expand-field\")")

    mockOpen.mockRestore()
  })
})
