
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Survey } from "../page";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useMemo } from "react";

interface SurveyResultsModalProps {
    survey: Survey | null;
    isOpen: boolean;
    onClose: () => void;
}

export function SurveyResultsModal({ survey, isOpen, onClose }: SurveyResultsModalProps) {
    if (!survey) return null;

    const totalVotes = survey.options.reduce((acc, opt) => acc + opt.votes, 0);
    const sortedOptions = useMemo(() => [...survey.options].sort((a,b) => b.votes - a.votes), [survey.options]);

    const chartData = sortedOptions.map(option => ({
        name: option.value,
        votes: option.votes,
    }));

    const chartConfig = {
        votes: {
            label: "Stimmen",
            color: "hsl(var(--primary))",
        },
    } satisfies ChartConfig;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Ergebnisse: {survey.question}</DialogTitle>
                    <DialogDescription>
                        Insgesamt {totalVotes} Stimme{totalVotes !== 1 ? 'n' : ''} abgegeben.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="h-[250px]">
                         <ChartContainer config={chartConfig} className="w-full h-full">
                            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={10}
                                    width={120}
                                    tick={{
                                        fontSize: 12,
                                        // Truncate long labels
                                        textAnchor: 'start',
                                        width: 110,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                />
                                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent />} />
                                <Bar dataKey="votes" fill="var(--color-votes)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </div>

                    <div className="space-y-4">
                        {sortedOptions.map(option => (
                            <div key={option.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium">{option.value}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {option.votes} ({totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(0) : 0}%)
                                    </span>
                                </div>
                                <Progress value={totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0} />
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} variant="outline">Schließen</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
