/**
 * Auto-generated Types for: ai/detect
 * Sinh tự động từ endpoint Backend
 */
export interface AiDetectResponse {
    model_version: string | null
    width: number
    height: number
    count: number
    detections: DetectionResult[]
}

export interface BoundingBox {
    x1?: number
    y1?: number
    x2?: number
    y2?: number
    width?: number
    height?: number
}

export interface DetectionResult {
    class_id?: number
    class_name?: string | null
    confidence?: number
    bounding_box?: BoundingBox
}

