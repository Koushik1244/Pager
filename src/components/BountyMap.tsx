"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function BountyMap() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [bounties, setBounties] = useState<any[]>([]);

    useEffect(() => {
        console.log("Mapbox Token:", process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
    }, []);

    // Load bounties
    useEffect(() => {
        const fetchBounties = async () => {
            const res = await axios.get("/api/bounty/all");
            setBounties(res.data.bounties);
        };
        fetchBounties();
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current) return;
        if (map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: [0, 20],
            zoom: 2,
        });
    }, []);

    // Add markers
    useEffect(() => {
        if (!map.current) return;

        bounties.forEach((bounty) => {
            if (!bounty.location?.lng || !bounty.location?.lat) return;

            new mapboxgl.Marker()
                .setLngLat([bounty.location.lng, bounty.location.lat])
                .setPopup(
                    new mapboxgl.Popup().setHTML(`
            <strong>@${bounty.username}</strong><br/>
            ${bounty.description}<br/>
            $${bounty.reward} USDC
          `)
                )
                .addTo(map.current!);
        });
    }, [bounties]);

    return (
        <div
            ref={mapContainer}
            style={{ width: "100%", height: "80vh" }}
        />
    );
}
