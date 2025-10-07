import { NextResponse } from 'next/server';
import { ShiprocketService } from '@/lib/shiprocket-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get('shipmentId');
    const awb = searchParams.get('awb');

    if (!shipmentId && !awb) {
      return NextResponse.json({
        success: false,
        error: 'shipmentId or awb is required'
      }, { status: 400 });
    }

    // Prefer shipmentId API. If only AWB provided, attempt Shiprocket AWB track endpoint.
    let raw: any;
    if (shipmentId) {
      raw = await ShiprocketService.getTracking(shipmentId);
    } else if (awb) {
      // Fallback: call Shiprocket AWB tracking directly using the authenticated token
      const token = await (ShiprocketService as any).authenticate?.();
      const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      raw = await res.json();
      if (!res.ok) {
        throw new Error(`Shiprocket AWB tracking failed: ${res.status} - ${JSON.stringify(raw)}`);
      }
    }

    // Normalize response
    const trackingData = raw?.tracking_data || raw?.data || raw;
    const shipmentStatus = trackingData?.shipment_status || trackingData?.current_status || raw?.status;
    const statusCode = trackingData?.shipment_status_code || trackingData?.current_status_code || raw?.status_code;
    const courierName = trackingData?.courier_name || raw?.courier_name || raw?.courierName;
    const awbCode = trackingData?.awb_code || raw?.awb_code || awb || null;
    const etd = trackingData?.etd || trackingData?.edd || trackingData?.expected_date; // expected delivery
    const checkpoints = trackingData?.shipment_track || trackingData?.track_activities || trackingData?.scan || [];

    return NextResponse.json({
      success: true,
      data: {
        status: shipmentStatus,
        statusCode,
        courierName,
        awbCode,
        expectedDelivery: etd || null,
        checkpoints,
        raw,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


