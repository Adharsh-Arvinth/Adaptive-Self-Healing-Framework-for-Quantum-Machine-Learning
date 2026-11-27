# Zenodo release checklist

1. Verify the working tree and candidate release commit. Check that the unpublished manuscript, local configuration, credentials and generated scratch files are outside the tracked release. The root MIT [LICENSE](LICENSE) covers the code. The generated benchmark declares MIT in its [datasheet](research/dataset/qfaultbench_v1/DATASHEET.md). Review [external-input terms](research/external/README.md) if you add third-party raw material.
2. Resolve the latent-onset export discrepancy before tagging. The current flat CSV writes step 15 for latent faults, while the released raw episodes place injection four steps earlier. Confirm whether to correct the export field or document it as the checkpoint step. Keep the released episode results traceable. Check the dataset before tagging. Run from the repository root in PowerShell:

   ```powershell
   $dataset = 'research/dataset/qfaultbench_v1'
   Get-Content "$dataset/SHA256SUMS" | ForEach-Object {
     $expected, $name = $_ -split '  ', 2
     $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $dataset $name)).Hash
     if ($actual -ine $expected) { throw "Checksum mismatch: $name" }
     Write-Output "OK $name"
   }
   ```

3. In Zenodo, link GitHub and enable this repository before publishing its first release. For this repo, the archive uses CITATION.cff. Confirm its title, author, and license in the release preview. [Zenodo GitHub setup](https://help.zenodo.org/docs/github/enable-repository/)
4. Merge the reviewed release changes into the publication branch and push it. Choose an unused tag such as `qfaultbench-v1.0.0`, then run `git tag -a qfaultbench-v1.0.0 -m "QFaultBench-VQC v1.0.0"` and `git push origin qfaultbench-v1.0.0`. On GitHub, publish a release for that tag. Include the scope and limitations, and link to the datasheet and checksums.
5. Wait for Zenodo to archive the GitHub release. Open the record, confirm the version tag and MIT license, download the source archive, and verify the tracked dataset checksums. Copy the version-specific DOI and verify that it resolves. [Zenodo archive guide](https://help.zenodo.org/docs/github/archive-software/github-upload/)
6. Backfill the version DOI in the manuscript’s Data Availability, README, and the top-level `doi` in CITATION.cff. Set Vercel’s `NEXT_PUBLIC_PAPER_URL` to the public manuscript or paper DOI URL when available. If the archive legitimately serves as the public paper landing page, the Zenodo URL can serve both purposes. Set Vercel’s `NEXT_PUBLIC_DATASET_ARCHIVE_URL` to the Zenodo version DOI URL for the Resources dataset card. Rebuild the manuscript and frontend, then deploy the reviewed site. Keep the archived tag immutable.
