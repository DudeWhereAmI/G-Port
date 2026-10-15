export const ADMIN_ZONES = [
  { id: "ZONE_1", label: "Phân khu 1: Cầu bến chính (Quay & Berth)" },
  { id: "ZONE_2", label: "Phân khu 2: Bãi Container (Yard)" },
  { id: "ZONE_3", label: "Phân khu 3: Cổng & Tòa nhà (Gate & Office)" },
  { id: "ZONE_4", label: "Phân khu 4: Khu vực kỹ thuật (Technical)" },
];

export const DYNAMIC_ACTIVITY_CONFIG: Record<string, any> = {
  TERMINAL_OPERATOR: [
    { 
      id: "loading_dyn", 
      label: "Vessel Loading & Unloading (Dynamic)", 
      fields: [
        { name: "operating_hours", label: "Operating Hours", type: "number", units: ["hrs", "mins"] },
        { name: "electricity_kwh", label: "Electricity Consumption", type: "number", units: ["kWh", "MWh"] },
        { name: "fuel_liters", label: "Fuel Consumption", type: "number", units: ["liters", "gallons", "m3"] },
        { name: "teu_handled", label: "TEU Handled", type: "number", units: ["TEU"] },
        { name: "opex", label: "Chi phí vận hành (OpEx)", type: "number", units: ["VNĐ"] }
      ] 
    },
    { 
      id: "yard_dyn", 
      label: "Yard Operations (Dynamic)", 
      fields: [
        { name: "operating_hours", label: "Operating Hours", type: "number", units: ["hrs", "mins"] },
        { name: "fuel_liters", label: "Fuel Consumption", type: "number", units: ["liters", "gallons"] },
        { name: "electricity_kwh", label: "Electricity Consumption", type: "number", units: ["kWh", "MWh"] },
        { name: "load_utilization", label: "Load Utilization", type: "number", units: ["%"] },
        { name: "opex", label: "Chi phí vận hành (OpEx)", type: "number", units: ["VNĐ"] }
      ] 
    },
    { 
      id: "reefer_dyn", 
      label: "Reefer Management (Dynamic)", 
      fields: [
        { name: "active_reefer_count", label: "Active Reefer Count", type: "number", units: ["units"] },
        { name: "dwell_time", label: "Dwell Time", type: "number", units: ["hrs", "days"] },
        { name: "electricity_kwh", label: "Electricity Consumption", type: "number", units: ["kWh", "MWh"] },
        { name: "refrigerant_refill", label: "Refrigerant Refill", type: "number", units: ["kg", "lbs"] },
        { name: "opex", label: "Chi phí vận hành (OpEx)", type: "number", units: ["VNĐ"] }
      ] 
    }
  ],
  OCEAN_CARRIER: [
    { 
      id: "maneuvering_dyn", 
      label: "Maneuvering (Dynamic)", 
      fields: [
        { name: "fuel_type", label: "Fuel Type Used", type: "select", options: ["HFO", "MDO", "LNG", "VLSFO"] },
        { name: "maneuvering_time", label: "Maneuvering Time", type: "number", units: ["hrs", "mins"] },
        { name: "me_load_factor", label: "ME Load Factor", type: "number", units: ["%"] },
        { name: "opex", label: "Chi phí vận hành (OpEx)", type: "number", units: ["VNĐ"] }
      ] 
    },
    { 
      id: "hoteling_dyn", 
      label: "Hoteling / Berthing (Dynamic)", 
      fields: [
        { name: "hoteling_time", label: "Hoteling Time", type: "number", units: ["hrs", "mins"] },
        { name: "ae_load_factor", label: "AE Load Factor", type: "number", units: ["%"] },
        { name: "ops_connected", label: "OPS Connected", type: "select", options: ["Yes", "No"] },
        { name: "ops_electricity", label: "OPS Electricity", type: "number", units: ["kWh", "MWh"] },
        { name: "opex", label: "Chi phí vận hành (OpEx)", type: "number", units: ["VNĐ"] }
      ] 
    }
  ],
  LOGISTICS_3PL: [
    { 
      id: "gate_dyn", 
      label: "Gate Activity (Dynamic)", 
      fields: [
        { name: "gate_in_time", label: "Gate In Time", type: "datetime-local" },
        { name: "gate_out_time", label: "Gate Out Time", type: "datetime-local" },
        { name: "idling_hours", label: "Calculated Idling", type: "number", units: ["hrs", "mins"] },
        { name: "opex", label: "Chi phí vận hành (OpEx)", type: "number", units: ["VNĐ"] }
      ] 
    },
    { 
      id: "transit_dyn", 
      label: "Transit (Dynamic)", 
      fields: [
        { name: "distance", label: "Distance Traveled", type: "number", units: ["km", "miles"] },
        { name: "cargo_weight", label: "Cargo Weight", type: "number", units: ["tons", "kg", "lbs"] },
        { name: "opex", label: "Chi phí vận hành (OpEx)", type: "number", units: ["VNĐ"] }
      ] 
    }
  ],
  PORT_MARINE_SERVICES: [
    { 
      id: "towing_dyn", 
      label: "Towing Job (Dynamic)", 
      fields: [
        { name: "job_duration", label: "Job Duration", type: "number", units: ["hrs", "mins"] },
        { name: "fuel_consumed", label: "Fuel Consumed", type: "number", units: ["liters", "gallons", "m3"] },
        { name: "vessel_imo", label: "Assisted Vessel IMO", type: "text" },
        { name: "opex", label: "Chi phí vận hành (OpEx)", type: "number", units: ["VNĐ"] }
      ] 
    }
  ],
  ADMIN: [
    { 
      id: "mother_vessel", 
      zone: "ZONE_1",
      label: "Tàu mẹ (Mother Vessel)", 
      fields: [
        { name: "vessel_name", label: "Tên tàu (Vessel Name)", type: "text" },
        { name: "imo_number", label: "IMO Number", type: "text" },
        { name: "aux_engine_power_kw", label: "Công suất Động cơ phụ (Aux Engine Power)", type: "number", units: ["kW"] },
        { name: "load_factor", label: "Hệ số tải (Load Factor)", type: "number", units: ["%"] },
        { name: "hoteling_time_hrs", label: "Thời gian neo đậu (Hoteling Time)", type: "number", units: ["hrs"] }
      ]
    },
    { 
      id: "sts_crane", 
      zone: "ZONE_1",
      label: "Cẩu bờ STS", 
      fields: [
        { name: "operating_hours", label: "Giờ hoạt động (Operating Hours)", type: "number", units: ["hrs"] },
        { name: "electricity_kwh", label: "Điện tiêu thụ (Electricity Consumed)", type: "number", units: ["kWh"] },
        { name: "teu_handled", label: "Sản lượng (TEU Handled)", type: "number", units: ["TEU"] }
      ]
    },
    { 
      id: "barge_crane", 
      zone: "ZONE_1",
      label: "Cẩu sà lan chuyên dụng", 
      fields: [
        { name: "operating_hours", label: "Giờ hoạt động (Operating Hours)", type: "number", units: ["hrs"] },
        { name: "electricity_kwh", label: "Điện tiêu thụ (Electricity Consumed)", type: "number", units: ["kWh"] },
        { name: "teu_handled", label: "Sản lượng (TEU Handled)", type: "number", units: ["TEU"] }
      ]
    },
    { 
      id: "tugboat", 
      zone: "ZONE_1",
      label: "Đội tàu dịch vụ (Tugboats & Pilot boats)", 
      fields: [
        { name: "operating_hours", label: "Giờ hoạt động (Operating Hours)", type: "number", units: ["hrs"] },
        { name: "fuel_consumed_liters", label: "Nhiên liệu tiêu thụ (Fuel Consumed)", type: "number", units: ["liters"] }
      ]
    },
    { 
      id: "ertg_crane", 
      zone: "ZONE_2",
      label: "Cẩu bãi RTG", 
      fields: [
        { name: "electricity_kwh", label: "Điện tiêu thụ - Nâng hạ (Electricity - Lifting)", type: "number", units: ["kWh"] },
        { name: "fuel_liters", label: "Nhiên liệu - Chuyển lane (Fuel - Lane Change)", type: "number", units: ["liters"] },
        { name: "operating_hours", label: "Giờ hoạt động (Operating Hours)", type: "number", units: ["hrs"] }
      ]
    },
    { 
      id: "terminal_tractor", 
      zone: "ZONE_2",
      label: "Xe đầu kéo nội bộ", 
      fields: [
        { name: "operating_hours", label: "Giờ hoạt động (Operating Hours)", type: "number", units: ["hrs"] },
        { name: "idling_time_hrs", label: "Thời gian nổ máy chờ (Idling Time)", type: "number", units: ["hrs"] },
        { name: "fuel_consumed_liters", label: "Nhiên liệu tiêu thụ (Fuel Consumed)", type: "number", units: ["liters"] }
      ]
    },
    { 
      id: "reach_stacker", 
      zone: "ZONE_2",
      label: "Xe nâng hàng (Laden Reach Stackers)", 
      fields: [
        { name: "operating_hours", label: "Giờ hoạt động (Operating Hours)", type: "number", units: ["hrs"] },
        { name: "idling_time_hrs", label: "Thời gian nổ máy chờ (Idling Time)", type: "number", units: ["hrs"] },
        { name: "fuel_consumed_liters", label: "Nhiên liệu tiêu thụ (Fuel Consumed)", type: "number", units: ["liters"] }
      ]
    },
    { 
      id: "empty_handler", 
      zone: "ZONE_2",
      label: "Xe nâng rỗng (Empty Container Handlers)", 
      fields: [
        { name: "operating_hours", label: "Giờ hoạt động (Operating Hours)", type: "number", units: ["hrs"] },
        { name: "idling_time_hrs", label: "Thời gian nổ máy chờ (Idling Time)", type: "number", units: ["hrs"] },
        { name: "fuel_consumed_liters", label: "Nhiên liệu tiêu thụ (Fuel Consumed)", type: "number", units: ["liters"] }
      ]
    },
    { 
      id: "reefer_plug", 
      zone: "ZONE_2",
      label: "Container lạnh (Reefer Container)", 
      fields: [
        { name: "active_plugs", label: "Số ổ cắm đang sử dụng (Active Plugs)", type: "number" },
        { name: "electricity_kwh", label: "Điện tiêu thụ (Electricity Consumed)", type: "number", units: ["kWh"] },
        { name: "refrigerant_refilled_kg", label: "Môi chất nạp thêm (Refrigerant Refilled)", type: "number", units: ["kg"] }
      ]
    },
    { 
      id: "high_mast_lighting", 
      zone: "ZONE_2",
      label: "Hệ thống chiếu sáng bãi", 
      fields: [
        { name: "operating_hours", label: "Giờ hoạt động (Operating Hours)", type: "number", units: ["hrs"] },
        { name: "electricity_kwh", label: "Điện tiêu thụ (Electricity Consumed)", type: "number", units: ["kWh"] }
      ]
    },
    { 
      id: "external_truck", 
      zone: "ZONE_3",
      label: "Xe tải đường bộ (External Highway Trucks)", 
      fields: [
        { name: "idling_time_hrs", label: "Thời gian nổ máy chờ tại cổng (Idling Time at Gate)", type: "number", units: ["hrs"] }
      ]
    },
    { 
      id: "gate_office", 
      zone: "ZONE_3",
      label: "Tòa nhà 2 tầng (Gatehouse & Customer Service)", 
      fields: [
        { name: "facility_electricity_kwh", label: "Điện tiêu thụ tòa nhà (Facility Electricity)", type: "number", units: ["kWh"] },
        { name: "gate_queue_time_hrs", label: "Thời gian chờ tại cổng (Gate Queue Time)", type: "number", units: ["hrs"] }
      ]
    },
    { 
      id: "fueling_station", 
      zone: "ZONE_4",
      label: "Trạm cấp nhiên liệu nội bộ", 
      fields: [
        { name: "fuel_throughput_liters", label: "Lượng nhiên liệu cấp (Fuel Throughput)", type: "number", units: ["liters"] }
      ]
    },
    { 
      id: "backup_genset", 
      zone: "ZONE_4",
      label: "Máy phát điện dự phòng", 
      fields: [
        { name: "operating_hours", label: "Giờ hoạt động (Operating Hours)", type: "number", units: ["hrs"] },
        { name: "fuel_consumed_liters", label: "Nhiên liệu tiêu thụ (Fuel Consumed)", type: "number", units: ["liters"] }
      ]
    },
    { 
      id: "maintenance_workshop", 
      zone: "ZONE_4",
      label: "Xưởng sửa chữa", 
      fields: [
        { name: "facility_electricity_kwh", label: "Điện tiêu thụ xưởng (Facility Electricity)", type: "number", units: ["kWh"] }
      ]
    },
    { 
      id: "hq_office", 
      zone: "ZONE_4",
      label: "Tòa nhà Saigon Newport (HQ)", 
      fields: [
        { name: "facility_electricity_kwh", label: "Điện tiêu thụ tòa nhà (Facility Electricity)", type: "number", units: ["kWh"] }
      ]
    }
  ]
};

export const ACTIVITY_CONFIG: Record<string, any> = {
  ADMIN: [
    { 
      id: "sts_crane", 
      zone: "ZONE_1",
      label: "Cẩu bờ STS", 
      fields: [
        { name: "asset_id", label: "Mã tài sản (Asset ID)", type: "text", readOnly: true },
        { name: "asset_name", label: "Tên tài sản (Asset Name)", type: "text" },
        { name: "power_source", label: "Nguồn điện (Power Source)", type: "select", options: ["Grid", "Solar", "Wind", "Biomass"] },
        { name: "rated_power_kw", label: "Công suất định mức (Rated Power)", type: "number", units: ["kW"] },
        { name: "initial_capex", label: "Vốn đầu tư ban đầu (Initial CapEx)", type: "number", units: ["VNĐ"] }
      ]
    },
    { 
      id: "barge_crane", 
      zone: "ZONE_1",
      label: "Cẩu sà lan chuyên dụng", 
      fields: [
        { name: "asset_id", label: "Mã tài sản (Asset ID)", type: "text", readOnly: true },
        { name: "asset_name", label: "Tên tài sản (Asset Name)", type: "text" },
        { name: "power_source", label: "Nguồn điện (Power Source)", type: "select", options: ["Grid", "Solar", "Wind", "Biomass"] },
        { name: "rated_power_kw", label: "Công suất định mức (Rated Power)", type: "number", units: ["kW"] },
        { name: "initial_capex", label: "Vốn đầu tư ban đầu (Initial CapEx)", type: "number", units: ["VNĐ"] }
      ]
    },
    { 
      id: "tugboat", 
      zone: "ZONE_1",
      label: "Đội tàu dịch vụ (Tugboats & Pilot boats)", 
      fields: [
        { name: "asset_id", label: "Mã tài sản (Asset ID)", type: "text", readOnly: true },
        { name: "asset_name", label: "Tên tài sản (Asset Name)", type: "text" },
        { name: "engine_max_power_kw", label: "Công suất động cơ (Engine Power)", type: "number", units: ["kW"] },
        { name: "fuel_type", label: "Loại nhiên liệu (Fuel Type)", type: "select", options: ["Diesel", "MDO", "HFO", "LNG"] },
        { name: "initial_capex", label: "Vốn đầu tư ban đầu (Initial CapEx)", type: "number", units: ["VNĐ"] }
      ]
    },
    { 
      id: "ertg_crane", 
      zone: "ZONE_2",
      label: "Cẩu bãi RTG", 
      fields: [
        { name: "asset_id", label: "Mã tài sản (Asset ID)", type: "text", readOnly: true },
        { name: "asset_name", label: "Tên tài sản (Asset Name)", type: "text" },
        { name: "rtg_type", label: "Loại RTG", type: "select", options: ["e-RTG", "fuel-based RTG"] },
        { name: "rated_power_kw", label: "Rated Power (kW)", type: "number" },
        { name: "initial_capex", label: "Vốn đầu tư ban đầu (Initial CapEx)", type: "number", units: ["VNĐ"] }
      ]
    },
    { 
      id: "terminal_tractor", 
      zone: "ZONE_2",
      label: "Xe đầu kéo nội bộ", 
      fields: [
        { name: "asset_id", label: "Mã tài sản (Asset ID)", type: "text", readOnly: true },
        { name: "asset_name", label: "Tên tài sản (Asset Name)", type: "text" },
        { name: "engine_max_power_kw", label: "Công suất động cơ (Engine Power)", type: "number", units: ["kW"] },
        { name: "fuel_type", label: "Loại nhiên liệu (Fuel Type)", type: "select", options: ["Diesel", "MDO", "HFO", "LNG", "Electric"] },
        { name: "initial_capex", label: "Vốn đầu tư ban đầu (Initial CapEx)", type: "number", units: ["VNĐ"] }
      ]
    },
    { 
      id: "reach_stacker", 
      zone: "ZONE_2",
      label: "Xe nâng hàng (Laden Reach Stackers)", 
      fields: [
        { name: "asset_id", label: "Mã tài sản (Asset ID)", type: "text", readOnly: true },
        { name: "asset_name", label: "Tên tài sản (Asset Name)", type: "text" },
        { name: "engine_max_power_kw", label: "Công suất động cơ (Engine Power)", type: "number", units: ["kW"] },
        { name: "fuel_type", label: "Loại nhiên liệu (Fuel Type)", type: "select", options: ["Diesel", "MDO", "HFO", "LNG"] },
        { name: "initial_capex", label: "Vốn đầu tư ban đầu (Initial CapEx)", type: "number", units: ["VNĐ"] }
      ]
    },
    { 
      id: "empty_handler", 
      zone: "ZONE_2",
      label: "Xe nâng rỗng (Empty Container Handlers)", 
      fields: [
        { name: "asset_id", label: "Mã tài sản (Asset ID)", type: "text", readOnly: true },
        { name: "asset_name", label: "Tên tài sản (Asset Name)", type: "text" },
        { name: "engine_max_power_kw", label: "Công suất động cơ (Engine Power)", type: "number", units: ["kW"] },
        { name: "fuel_type", label: "Loại nhiên liệu (Fuel Type)", type: "select", options: ["Diesel", "MDO", "HFO", "LNG"] },
        { name: "initial_capex", label: "Vốn đầu tư ban đầu (Initial CapEx)", type: "number", units: ["VNĐ"] }
      ]
    },
    { 
      id: "reefer_plug", 
      zone: "ZONE_2",
      label: "Container lạnh (Reefer Container)", 
      fields: [
        { name: "asset_id", label: "Mã tài sản (Asset ID)", type: "text", readOnly: true },
        { name: "asset_name", label: "Tên tài sản (Asset Name)", type: "text" },
        { name: "zone_id", label: "Mã khu vực (Zone ID)", type: "text" },
        { name: "power_source", label: "Nguồn điện (Power Source)", type: "select", options: ["Grid", "Solar", "Wind", "Biomass"] },
        { name: "initial_capex", label: "Vốn đầu tư ban đầu (Initial CapEx)", type: "number", units: ["VNĐ"] }
      ]
    }
  ]
};
